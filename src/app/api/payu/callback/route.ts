import { NextRequest, NextResponse } from "next/server"
import { verifyPayUHash } from "@/lib/payu"
import { createClient } from "@/lib/supabase/server"
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

export async function POST(request: NextRequest) {
  try {
    // PayU sends data as application/x-www-form-urlencoded
    const body = await request.text()
    const payload = Object.fromEntries(new URLSearchParams(body).entries()) as any

    console.log("[PAYU] Callback hit:", payload.status, payload.txnid)

    const key = String(payload.key || "")
    let salt = process.env.PAYU_MERCHANT_SALT
    
    // Fallback for public test key if env var is missing
    if (!salt && key === "gtKFFx") {
      salt = "4R38IvwiV57FwVpsgOvTXBdLE4tHUXFW" 
    }

    if (!verifyPayUHash(payload, salt || "")) {
      console.error("[PAYU] Hash verification failed")
      return htmlRedirect("/checkout?step=payment&error=invalid_hash")
    }

    const status = String(payload.status || "")
    const cartId = String(payload.udf1 || "")
    const txnid = String(payload.txnid || "")
    const amount = String(payload.amount || "")
    const email = String(payload.email || "")

    if (status === "success") {
      const supabase = await createClient()
      
      // Use cartId from UDF1 directly to bypass cookie issues
      const cart = await retrieveCart(cartId)
      
      if (!cart) {
        console.error("[PAYU] Cart not found:", cartId)
        // Even if cart not found, we redirect to failure/cart page rather than 500 error
        return htmlRedirect("/checkout?error=cart_not_found")
      }

      // Create Order
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
        // Redirect to a generic success page or cart with error if order creation failed but payment succeeded
        // Ideally we should log this for manual reconciliation
        return htmlRedirect("/checkout?error=order_creation_failed_payment_success")
      }

      // Success! Return HTML that deletes the cookie and redirects
      const response = htmlRedirect(`/order/confirmed/${order.id}`)
      response.cookies.delete("toycker_cart_id")
      return response
    }

    return htmlRedirect(`/checkout?step=payment&error=payment_failed&status=${encodeURIComponent(status)}`)
  } catch (error) {
    console.error("[PAYU] Callback fatal error:", error)
    return htmlRedirect("/checkout?error=callback_failed")
  }
}

export async function GET() {
  return new NextResponse("PayU Callback Endpoint Active", { status: 200 })
}