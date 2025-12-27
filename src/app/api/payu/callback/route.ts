import { NextRequest, NextResponse } from "next/server"
import { verifyPayUHash } from "@/lib/payu"
import { createClient } from "@/lib/supabase/server"
import { retrieveCart } from "@/lib/data/cart"

/**
 * Returns a standard HTML response that performs a client-side redirect.
 * This is the most robust way to handle PayU's POST callback handshakes.
 */
function htmlRedirect(path: string) {
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"></head>
     <body><script>window.location.replace(${JSON.stringify(path)})</script></body></html>`,
    { 
      status: 200, 
      headers: { "Content-Type": "text/html; charset=utf-8" } 
    }
  )
}

export async function POST(request: NextRequest) {
  try {
    // Parse PayU's x-www-form-urlencoded payload
    const body = await request.text()
    const payload = Object.fromEntries(new URLSearchParams(body).entries()) as any
    
    const key = payload.key
    let salt = process.env.PAYU_MERCHANT_SALT || ""
    
    if (key === "gtKFFx") {
      salt = "4R38IvwiV57FwVpsgOvTXBdLE4tHUXFW"
    }

    if (!verifyPayUHash(payload, salt)) {
      console.error("[PayU Callback] Invalid Hash Verification")
      return htmlRedirect("/checkout?step=payment&error=invalid_hash")
    }

    const { status, txnid, amount, email, udf1: cartId } = payload

    if (status === "success") {
      const supabase = await createClient()
      const cart = await retrieveCart(cartId)
      
      if (!cart) {
        return htmlRedirect("/checkout?error=cart_not_found")
      }

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
        return htmlRedirect("/checkout?error=order_creation_failed")
      }

      const response = htmlRedirect(`/order/confirmed/${order.id}`)
      // Explicitly delete the cart cookie on the response
      response.cookies.delete("toycker_cart_id")
      return response
    }

    return htmlRedirect(`/checkout?step=payment&error=payment_failed&status=${encodeURIComponent(status)}`)
  } catch (error) {
    console.error("[PayU Callback] Fatal Error:", error)
    return htmlRedirect("/checkout?error=callback_failed")
  }
}