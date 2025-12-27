import { NextRequest, NextResponse } from "next/server"
import { verifyPayUHash } from "@/lib/payu"
import { createClient } from "@/lib/supabase/server"
import { retrieveCart } from "@/lib/data/cart"

// Ensure this runs on Node.js to support crypto
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Define the shape of PayU Callback Data
interface PayUCallbackBody {
  status: string
  txnid: string
  amount: string
  productinfo: string
  firstname: string
  email: string
  key: string
  hash: string
  udf1?: string // We store cartId here
  udf2?: string
  udf3?: string
  udf4?: string
  udf5?: string
  error_Message?: string
  [key: string]: string | undefined
}

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

export async function POST(request: NextRequest) {
  try {
    // PayU sends data as application/x-www-form-urlencoded
    const bodyText = await request.text()
    const params = new URLSearchParams(bodyText)
    const payload = Object.fromEntries(params.entries()) as unknown as PayUCallbackBody

    console.log("[PAYU] Callback hit:", payload.status, payload.txnid)

    // 1. Retrieve Salt from Environment
    const salt = process.env.PAYU_MERCHANT_SALT

    if (!salt) {
      console.error("[PAYU] Configuration error: Missing Salt")
      return htmlRedirect("/checkout?step=payment&error=configuration_error")
    }

    // 2. Verify Hash integrity
    if (!verifyPayUHash(payload, salt)) {
      console.error("[PAYU] Hash verification failed")
      return htmlRedirect("/checkout?step=payment&error=invalid_hash")
    }

    const status = payload.status
    const cartId = payload.udf1 || ""
    const txnid = payload.txnid
    const amount = payload.amount
    const email = payload.email

    if (status === "success") {
      const supabase = await createClient()
      
      // Use cartId from UDF1 directly
      const cart = await retrieveCart(cartId)
      
      if (!cart) {
        console.error("[PAYU] Cart not found:", cartId)
        return htmlRedirect("/checkout?error=cart_not_found")
      }

      // 3. Create Order in Database
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: cart.user_id,
          customer_email: email || cart.email || "guest@toycker.com",
          total_amount: parseFloat(amount),
          currency_code: cart.currency_code || "inr",
          status: "paid",
          payment_status: "captured",
          fulfillment_status: "not_shipped",
          payu_txn_id: txnid,
          shipping_address: cart.shipping_address,
          billing_address: cart.billing_address,
          items: cart.items as any,
          shipping_methods: cart.shipping_methods as any,
          metadata: { cartId, payu_payload: payload }
        })
        .select()
        .single()

      if (error) {
        console.error("[PAYU] Order creation failed:", error.message)
        return htmlRedirect("/checkout?error=order_creation_failed_payment_success")
      }

      // Success! Redirect to confirmation
      const response = htmlRedirect(`/order/confirmed/${order.id}`)
      response.cookies.delete("toycker_cart_id")
      return response
    }

    // Handle Failure
    const failureReason = payload.error_Message || "payment_failed"
    return htmlRedirect(`/checkout?step=payment&error=${encodeURIComponent(failureReason)}&status=${encodeURIComponent(status)}`)
  } catch (error) {
    console.error("[PAYU] Callback fatal error:", error)
    return htmlRedirect("/checkout?error=callback_failed")
  }
}

export async function GET() {
  return new NextResponse("PayU Callback Endpoint Active", { status: 200 })
}