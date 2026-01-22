"use server"

import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import { Order } from "@/lib/supabase/types"
import { getAuthUser } from "./auth"
import { logOrderEvent } from "@/lib/data/admin"

export const listOrders = cache(async () => {
  const user = await getAuthUser()
  const supabase = await createClient()

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching orders:", error)
    return []
  }

  return data as Order[]
})

export async function retrieveOrder(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    console.error("Error fetching order:", error)
    return null
  }

  return data as Order
}

export async function cancelUserOrder(orderId: string) {
  const user = await getAuthUser()
  if (!user) {
    throw new Error("You must be logged in to cancel an order.")
  }

  const supabase = await createClient()
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!order) throw new Error("Order not found.")

  if (["accepted", "shipped", "delivered", "cancelled", "failed"].includes(order.status)) {
    throw new Error("Order can no longer be cancelled.")
  }

  const paymentStatus = order.payment_status === "captured" ? "refunded" : "cancelled"

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: "cancelled",
      fulfillment_status: "cancelled",
      payment_status: paymentStatus,
      updated_at: new Date().toISOString()
    })
    .eq("id", orderId)

  if (updateError) throw new Error(updateError.message)

  await logOrderEvent(
    orderId,
    "cancelled",
    "Order Cancelled",
    "Customer cancelled the order.",
    "customer",
    {},
    user.email || (user.user_metadata as any)?.full_name || "Customer"
  )

  return { success: true }
}