import { NextRequest, NextResponse } from "next/server"
import { verifyPayUHash, PayUCallbackPayload } from "@/lib/payu"
import { createAdminClient } from "@/lib/supabase/admin"
import { Address, Cart, Order } from "@/lib/supabase/types"
import { retrieveCart } from "@/lib/data/cart"
import {
  currencyAmountsMatch,
  getOrderPricingMetadata,
  getPendingPaymentProviderId,
  OrderPricingMetadata,
} from "@/lib/util/order-pricing"
import { getCustomerFacingEmail } from "@/lib/util/customer-email"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const RECENT_CALLBACKS = new Map<string, number>()
const THROTTLE_MS = 2000
const PAYU_PROVIDER_ID = "pp_payu_payu"

type AdminClient = Awaited<ReturnType<typeof createAdminClient>>

type CreateOrderWithPaymentResponse = {
  success?: boolean
  order_id?: string
}

type PayUOrderSnapshot = {
  email: string
  shippingAddress: Address
  billingAddress: Address
  paymentProviderId: string
  rewardsToApply: number
}

function htmlRedirect(path: string) {
  return new NextResponse(
    `<!doctype html><html><head><title>Redirecting...</title><meta charset="utf-8"></head>
     <body>
      <p>Processing payment response...</p>
      <script>window.location.replace(${JSON.stringify(path)})</script>
     </body></html>`,
    {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }
  )
}

const normalizeIp = (value: string | null): string =>
  value?.split(",")[0]?.trim() || "unknown"

const buildPayUOrderSnapshot = (
  cart: Cart,
  fallbackEmail: string
): PayUOrderSnapshot | null => {
  const shippingAddress = cart.shipping_address
  const billingAddress = cart.billing_address ?? cart.shipping_address

  if (!shippingAddress || !billingAddress) {
    return null
  }

  const rewardsToApplyFromMetadata =
    typeof cart.metadata?.rewards_to_apply === "number"
      ? cart.metadata.rewards_to_apply
      : Number(cart.rewards_to_apply ?? 0)

  return {
    email:
      getCustomerFacingEmail(fallbackEmail, cart.email) || "guest@toycker.in",
    shippingAddress,
    billingAddress,
    paymentProviderId:
      getPendingPaymentProviderId(cart.payment_collection) || PAYU_PROVIDER_ID,
    rewardsToApply: Number.isFinite(rewardsToApplyFromMetadata)
      ? rewardsToApplyFromMetadata
      : 0,
  }
}

const fetchLatestOrderForCart = async (
  supabase: AdminClient,
  cartId: string
): Promise<Order | null> => {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .contains("metadata", { cart_id: cartId })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data ? (data as Order) : null
}

const refreshPendingOrderSnapshot = async (
  supabase: AdminClient,
  cartId: string,
  snapshot: PayUOrderSnapshot
): Promise<Order> => {
  const { data, error } = await supabase.rpc("create_order_with_payment", {
    p_cart_id: cartId,
    p_email: snapshot.email,
    p_shipping_address: snapshot.shippingAddress,
    p_billing_address: snapshot.billingAddress,
    p_payment_provider: snapshot.paymentProviderId,
    p_rewards_to_apply: snapshot.rewardsToApply,
  })

  if (error) {
    throw new Error(error.message)
  }

  const result = data as CreateOrderWithPaymentResponse | null
  if (!result?.order_id) {
    throw new Error("create_order_with_payment did not return an order id")
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", result.order_id)
    .single()

  if (orderError || !order) {
    throw new Error(orderError?.message || "Failed to load refreshed order")
  }

  return order as Order
}

const mergePayUMetadata = (
  metadata: unknown,
  payload: PayUCallbackPayload,
  paymentMethod: string
): OrderPricingMetadata => ({
  ...getOrderPricingMetadata(metadata),
  payu_payload: payload,
  payment_method: paymentMethod,
})

export async function POST(request: NextRequest) {
  const ip = normalizeIp(request.headers.get("x-forwarded-for"))
  const now = Date.now()
  const lastHit = RECENT_CALLBACKS.get(ip)

  if (lastHit && now - lastHit < THROTTLE_MS) {
    console.warn("[PAYU] Throttling possible duplicate callback for IP:", ip)
    return new NextResponse("Throttled", { status: 429 })
  }
  RECENT_CALLBACKS.set(ip, now)

  if (RECENT_CALLBACKS.size > 1000) {
    RECENT_CALLBACKS.clear()
  }

  try {
    const bodyText = await request.text()
    const params = new URLSearchParams(bodyText)
    const payload = Object.fromEntries(params.entries()) as PayUCallbackPayload

    if (process.env.NODE_ENV === "development") {
      console.log("[PAYU] Callback hit:", {
        status: payload.status,
        txnid: payload.txnid,
        amount: payload.amount,
        key: payload.key?.substring(0, 6) + "...",
      })
    }

    const salt = process.env.PAYU_MERCHANT_SALT
    if (!salt) {
      console.error(
        "[PAYU] Configuration error: Missing PAYU_MERCHANT_SALT env var"
      )
      return htmlRedirect("/checkout?step=payment&error=configuration_error")
    }

    if (!verifyPayUHash(payload, salt)) {
      console.error("[PAYU] Hash verification failed for txnid:", payload.txnid)
      return htmlRedirect("/checkout?step=payment&error=invalid_hash")
    }

    const status = payload.status
    const cartId = payload.udf1 || ""
    const txnid = payload.txnid
    const amount = payload.amount
    const email = payload.email

    if (process.env.NODE_ENV === "development") {
      console.log("[PAYU] Processing payment:", { status, cartId, txnid, amount })
    }

    if (status === "success") {
      const supabase = await createAdminClient()
      const cart = await retrieveCart(cartId)

      if (!cart) {
        console.error("[PAYU] Cart not found:", cartId)
        return htmlRedirect("/checkout?error=cart_not_found")
      }

      const snapshot = buildPayUOrderSnapshot(cart, email)
      let orderToFinalize = await fetchLatestOrderForCart(supabase, cartId)

      const shouldRefreshPendingSnapshot =
        !orderToFinalize ||
        (orderToFinalize.payment_status !== "captured" &&
          !orderToFinalize.payment_method)

      if (shouldRefreshPendingSnapshot) {
        if (!snapshot) {
          console.error(
            "[PAYU] Missing checkout snapshot data for cart:",
            cartId
          )
          return htmlRedirect("/checkout?error=missing_checkout_snapshot")
        }

        try {
          orderToFinalize = await refreshPendingOrderSnapshot(
            supabase,
            cartId,
            snapshot
          )
        } catch (refreshError) {
          console.error("[PAYU] Failed to refresh pending order snapshot:", refreshError)
          return htmlRedirect("/checkout?error=order_snapshot_refresh_failed")
        }
      }

      if (!orderToFinalize) {
        console.error("[PAYU] No order available for cart:", cartId)
        return htmlRedirect("/checkout?error=order_not_found")
      }

      const paymentMethod =
        snapshot?.paymentProviderId ||
        orderToFinalize.payment_method ||
        PAYU_PROVIDER_ID
      const orderAlreadyCaptured = orderToFinalize.payment_status === "captured"
      const existingMetadata = getOrderPricingMetadata(orderToFinalize.metadata)

      if (
        !orderAlreadyCaptured &&
        !currencyAmountsMatch(orderToFinalize.total_amount, amount)
      ) {
        const { logOrderEvent } = await import("@/lib/data/admin")
        await logOrderEvent(
          orderToFinalize.id,
          "note_added",
          "Payment Amount Mismatch",
          `PayU amount ${amount} did not match stored order total ${orderToFinalize.total_amount}.`,
          "system"
        )

        console.error("[PAYU] Amount mismatch:", {
          orderId: orderToFinalize.id,
          orderTotal: orderToFinalize.total_amount,
          callbackAmount: amount,
        })

        return htmlRedirect("/checkout?step=payment&error=amount_mismatch")
      }

      const shouldUpdateGatewayDetails =
        !orderAlreadyCaptured ||
        !orderToFinalize.payu_txn_id ||
        !orderToFinalize.payment_method ||
        !existingMetadata.payu_payload

      let finalizedOrderData = orderToFinalize

      if (shouldUpdateGatewayDetails) {
        const metadata = mergePayUMetadata(
          orderToFinalize.metadata,
          payload,
          paymentMethod
        )

        const { data: updatedOrder, error: updateError } = await supabase
          .from("orders")
          .update({
            status: "order_placed",
            payment_status: "captured",
            payment_method: paymentMethod,
            payu_txn_id: orderAlreadyCaptured
              ? orderToFinalize.payu_txn_id || txnid
              : txnid,
            metadata,
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderToFinalize.id)
          .select()
          .single()

        if (updateError || !updatedOrder) {
          console.error(
            "[PAYU] Order update failed:",
            updateError?.message || "Unknown error"
          )
          return htmlRedirect("/checkout?error=order_update_failed_payment_success")
        }

        finalizedOrderData = updatedOrder as Order
      }

      if (!orderAlreadyCaptured) {
        const { handlePostOrderLogic } = await import("@lib/data/cart")
        const { logOrderEvent } = await import("@/lib/data/admin")
        const finalizedMetadata = getOrderPricingMetadata(
          finalizedOrderData.metadata
        )
        const rewardsToApply = Number(finalizedMetadata.rewards_used ?? 0)

        await handlePostOrderLogic(finalizedOrderData, cart, rewardsToApply)
        await logOrderEvent(
          finalizedOrderData.id,
          "order_placed",
          "Order Placed",
          "Order confirmed via PayU payment gateway callback.",
          "system"
        )
      }

      console.log("[PAYU] Order processed successfully:", finalizedOrderData.id)

      const response = htmlRedirect(`/order/confirmed/${finalizedOrderData.id}`)
      response.cookies.delete("toycker_cart_id")
      return response
    }

    const failureReason = payload.error_Message || "payment_failed"
    console.log("[PAYU] Payment failed:", { status, reason: failureReason })

    try {
      const supabase = await createAdminClient()
      const existingOrder = await fetchLatestOrderForCart(supabase, cartId)

      if (existingOrder && existingOrder.payment_status !== "captured") {
        await supabase
          .from("orders")
          .update({
            status: "cancelled",
            payment_status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingOrder.id)

        const { logOrderEvent } = await import("@/lib/data/admin")
        await logOrderEvent(
          existingOrder.id,
          "payment_failed",
          "Payment Failed",
          `Payment attempt failed or was cancelled via PayU. Reason: ${failureReason}`,
          "system"
        )
      }
    } catch (updateErr) {
      console.error("[PAYU] Failed to update order status for failure:", updateErr)
    }

    return htmlRedirect(
      `/checkout?step=payment&error=${encodeURIComponent(
        failureReason
      )}&status=${encodeURIComponent(status)}`
    )
  } catch (error) {
    console.error("[PAYU] Callback fatal error:", error)
    return htmlRedirect("/checkout?error=callback_failed")
  }
}

export async function GET() {
  return new NextResponse("PayU Callback Endpoint Active", { status: 200 })
}
