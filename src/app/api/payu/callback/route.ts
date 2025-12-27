import { NextRequest, NextResponse } from "next/server"
import { verifyPayUHash } from "@/lib/payu"
import { createClient } from "@/lib/supabase/server"
import { retrieveCart } from "@/lib/data/cart"

interface PayUCallbackPayload {
  status: string
  txnid: string
  amount: string
  email: string
  firstname: string
  productinfo: string
  key: string
  hash: string
  udf1: string // This is our Cart ID
  mihpayid: string
  mode: string
  additionalCharges?: string
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const payload = Object.fromEntries(formData.entries()) as unknown as PayUCallbackPayload
    
    const key = payload.key
    let salt = process.env.PAYU_MERCHANT_SALT || ""
    
    if (key === "gtKFFx") {
      salt = "4R38IvwiV57FwVpsgOvTXBdLE4tHUXFW"
    }

    const isValid = verifyPayUHash(payload, salt)

    if (!isValid) {
      console.error("[PayU Callback] Invalid Hash Verification Attempted")
      return NextResponse.redirect(new URL("/checkout?step=payment&error=invalid_hash", request.url), { status: 303 })
    }

    const { status, txnid, amount, email, udf1: cartId } = payload

    if (status === "success") {
      const supabase = await createClient()
      const cart = await retrieveCart(cartId)
      
      if (!cart) {
        console.error("[PayU Callback] Cart not found for ID:", cartId)
        return NextResponse.redirect(new URL("/checkout?error=cart_not_found", request.url), { status: 303 })
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
        console.error("[PayU Callback] Database Error creating order:", error.message)
        return NextResponse.redirect(new URL("/checkout?error=order_creation_failed", request.url), { status: 303 })
      }

      // Success redirect with 303 to force GET and clean up cookie
      const response = NextResponse.redirect(new URL(`/order/confirmed/${order.id}`, request.url), { status: 303 })
      response.cookies.delete("toycker_cart_id")
      return response
    }

    return NextResponse.redirect(new URL(`/checkout?step=payment&error=payment_failed&status=${status}`, request.url), { status: 303 })
  } catch (error) {
    console.error("[PayU Callback] Fatal Error Processing Response:", error)
    return NextResponse.redirect(new URL("/checkout?error=callback_failed", request.url), { status: 303 })
  }
}