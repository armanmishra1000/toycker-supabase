import { NextRequest, NextResponse } from "next/server"
import { verifyPayUHash, PayUCallbackPayload } from "@/lib/payu"
import { createAdminClient } from "@/lib/supabase/admin"
import { retrieveCart } from "@/lib/data/cart"

// Ensure this runs on Node.js to support crypto
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Returns a standard HTML page that redirects via JavaScript.
 * This satisfies PayU's requirement for a valid "page" response.
 */
function htmlRedirect(path: string) {
  return new NextResponse(
    `<!doctype html><html><head><title>Redirecting...</title><meta charset="utf-8"></head>
     <body>
      <p>Processing payment response...</p>
      <script>window.location.replace(${JSON.stringify(path)})</script>
     </body></html>`,
    {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    }
  )
}

const RECENT_CALLBACKS = new Map<string, number>()
const THROTTLE_MS = 2000 // 2 seconds

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown"
  const now = Date.now()
  const lastHit = RECENT_CALLBACKS.get(ip)

  if (lastHit && now - lastHit < THROTTLE_MS) {
    console.warn("[PAYU] Throttling possible duplicate callback for IP:", ip)
    return new NextResponse("Throttled", { status: 429 })
  }
  RECENT_CALLBACKS.set(ip, now)

  // Cleanup map periodically
  if (RECENT_CALLBACKS.size > 1000) RECENT_CALLBACKS.clear()

  try {
    // PayU sends data as application/x-www-form-urlencoded
    const bodyText = await request.text()
    const params = new URLSearchParams(bodyText)
    const payload = Object.fromEntries(params.entries()) as PayUCallbackPayload

    if (process.env.NODE_ENV === "development") {
      console.log("[PAYU] Callback hit:", {
        status: payload.status,
        txnid: payload.txnid,
        amount: payload.amount,
        key: payload.key?.substring(0, 6) + "..."
      })
    }

    // 1. Retrieve Salt from Environment
    const salt = process.env.PAYU_MERCHANT_SALT

    if (!salt) {
      console.error("[PAYU] Configuration error: Missing PAYU_MERCHANT_SALT env var")
      return htmlRedirect("/checkout?step=payment&error=configuration_error")
    }

    // 2. Verify Hash integrity
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

      // Use cartId from UDF1 directly
      const cart = await retrieveCart(cartId)

      if (!cart) {
        console.error("[PAYU] Cart not found:", cartId)
        return htmlRedirect("/checkout?error=cart_not_found")
      }

      // 3. Update Existing Order or Create New One
      // We prefer updating the one created by the RPC in completeCheckout
      let orderIdToUse: string | null = null

      const { data: existingOrder } = await supabase
        .from("orders")
        .select("*")
        .contains("metadata", { cart_id: cartId })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existingOrder) {
        console.log("[PAYU] Found existing order, updating:", existingOrder.id)
        orderIdToUse = existingOrder.id

        const { error: updateError } = await supabase
          .from("orders")
          .update({
            status: "paid",
            payment_status: "captured",
            payu_txn_id: txnid,
            updated_at: new Date().toISOString()
          })
          .eq("id", orderIdToUse)

        if (updateError) {
          console.error("[PAYU] Order update failed:", updateError.message)
          return htmlRedirect("/checkout?error=order_update_failed_payment_success")
        }
      } else {
        console.log("[PAYU] No existing order found, creating new one")
        // Fallback: Create New Order in Database
        // Use JSON serialization to properly type the complex objects
        const { data: order, error } = await supabase
          .from("orders")
          .insert({
            user_id: cart.user_id,
            customer_email: email || cart.email || "guest@toycker.com",
            email: email || cart.email || "guest@toycker.com", // Set both
            total_amount: parseFloat(amount),
            total: parseFloat(amount), // Set total as well
            subtotal: cart.subtotal || cart.item_subtotal || parseFloat(amount),
            tax_total: cart.tax_total || 0,
            shipping_total: cart.shipping_total || 0,
            discount_total: cart.discount_total || 0,
            currency_code: cart.currency_code || "inr",
            status: "paid",
            payment_status: "captured",
            fulfillment_status: "not_shipped",
            payu_txn_id: txnid,
            shipping_address: cart.shipping_address,
            billing_address: cart.billing_address || cart.shipping_address,
            items: JSON.parse(JSON.stringify(cart.items || [])),
            shipping_methods: JSON.parse(JSON.stringify(cart.shipping_methods || [])),
            metadata: { cartId, payu_payload: payload, cart_id: cartId }
          })
          .select()
          .single()

        if (error) {
          console.error("[PAYU] Order creation failed:", error.message)
          return htmlRedirect("/checkout?error=order_creation_failed_payment_success")
        }
        orderIdToUse = order.id
      }

      console.log("[PAYU] Order processed successfully:", orderIdToUse)

      // Log "Order Placed" event
      const { logOrderEvent } = await import("@/lib/data/admin")
      await logOrderEvent(
        orderIdToUse!,
        "order_placed",
        "Order Placed",
        "Order confirmed via PayU payment gateway callback.",
        "system"
      )

      // Success! Redirect to confirmation
      const response = htmlRedirect(`/order/confirmed/${orderIdToUse}`)
      response.cookies.delete("toycker_cart_id")
      return response
    }

    // Handle Failure
    const failureReason = payload.error_Message || "payment_failed"
    console.log("[PAYU] Payment failed:", { status, reason: failureReason })
    return htmlRedirect(`/checkout?step=payment&error=${encodeURIComponent(failureReason)}&status=${encodeURIComponent(status)}`)
  } catch (error) {
    console.error("[PAYU] Callback fatal error:", error)
    return htmlRedirect("/checkout?error=callback_failed")
  }
}

export async function GET() {
  return new NextResponse("PayU Callback Endpoint Active", { status: 200 })
}