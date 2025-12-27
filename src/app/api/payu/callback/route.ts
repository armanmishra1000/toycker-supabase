import { NextRequest, NextResponse } from "next/server"
import { verifyPayUHash } from "@/lib/payu"
import { createClient } from "@/lib/supabase/server"
import { retrieveCart } from "@/lib/data/cart"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const payload = Object.fromEntries(formData.entries())
    
    // Determine the correct salt to use for verification
    const key = payload.key as string
    let salt = process.env.PAYU_MERCHANT_SALT || ""
    
    // Force test salt if using the public test key
    if (key === "gtKFFx") {
      salt = "4R38IvwiV57FwVpsgOvTXBdLE4tHUXFW"
    }

    const isValid = verifyPayUHash(payload, salt)

    if (!isValid) {
      console.error("[PayU Callback] Invalid Hash Verification")
      return NextResponse.redirect(new URL("/checkout?error=invalid_hash", request.url))
    }

    const status = payload.status as string
    const txnid = payload.txnid as string
    const amount = payload.amount as string
    const email = payload.email as string
    const cartId = payload.udf1 as string // We stored cartId in udf1 during initiation

    if (status === "success") {
      const supabase = await createClient()
      
      // Fetch the cart to get full details (items, addresses, etc.)
      const cart = await retrieveCart(cartId)
      
      if (!cart) {
        console.error("[PayU Callback] Cart not found for ID:", cartId)
        return NextResponse.redirect(new URL("/checkout?error=cart_not_found", request.url))
      }

      // Create the order with all required data from the cart
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: cart.user_id,
          customer_email: email || cart.email,
          total_amount: parseFloat(amount),
          currency_code: cart.currency_code || "inr",
          status: "paid",
          payment_status: "captured",
          fulfillment_status: "not_shipped",
          payu_txn_id: txnid,
          shipping_address: cart.shipping_address,
          billing_address: cart.billing_address,
          items: cart.items,
          shipping_methods: cart.shipping_methods,
          metadata: { cartId, payu_payload: payload }
        })
        .select()
        .single()

      if (error) {
        console.error("[PayU Callback] Database Error creating order:", error)
        return NextResponse.redirect(new URL("/checkout?error=order_creation_failed", request.url))
      }

      // Clear the cart cookie now that the order is placed
      const cookieStore = await cookies()
      cookieStore.set("toycker_cart_id", "", { maxAge: -1 })

      // Redirect to the standard confirmation page
      return NextResponse.redirect(new URL(`/order/confirmed/${order.id}`, request.url))
    }

    // Handle failure status from PayU
    return NextResponse.redirect(new URL(`/checkout?error=payment_failed&status=${status}`, request.url))
  } catch (error) {
    console.error("[PayU Callback] Fatal Error:", error)
    return NextResponse.redirect(new URL("/checkout?error=callback_failed", request.url))
  }
}