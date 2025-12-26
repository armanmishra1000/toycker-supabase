import { NextRequest, NextResponse } from "next/server"
import { verifyPayUHash } from "@/lib/payu"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const payload = Object.fromEntries(formData.entries())
    
    const salt = process.env.PAYU_MERCHANT_SALT!
    const isValid = verifyPayUHash(payload, salt)

    if (!isValid) {
      console.error("[PayU Callback] Invalid Hash")
      return NextResponse.redirect(new URL("/checkout?error=invalid_hash", request.url))
    }

    const status = payload.status as string
    const txnid = payload.txnid as string
    const amount = payload.amount as string
    const email = payload.email as string
    const cartId = payload.udf1 as string

    if (status === "success") {
      const supabase = await createClient()
      
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          customer_email: email,
          total_amount: parseFloat(amount),
          status: "paid",
          payu_txn_id: txnid,
          metadata: { cartId, ...payload }
        })
        .select()
        .single()

      if (error) {
        console.error("[PayU Callback] Error creating order:", error)
        return NextResponse.redirect(new URL("/checkout?error=order_creation_failed", request.url))
      }

      return NextResponse.redirect(new URL(`/payu/success?orderId=${order.id}`, request.url))
    }

    return NextResponse.redirect(new URL(`/checkout?error=payment_failed&status=${status}`, request.url))
  } catch (error) {
    console.error("[PayU Callback] Fatal Error:", error)
    return NextResponse.redirect(new URL("/checkout?error=callback_failed", request.url))
  }
}
