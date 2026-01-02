"use server"

import { createClient } from "@/lib/supabase/server"
import { Order } from "@/lib/supabase/types"

export async function listOrders() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from("orders")
    .select("id, display_id, total, status, payment_status, fulfillment_status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching orders:", error)
    return []
  }

  return data as Order[]
}

export async function retrieveOrder(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("orders")
    .select("id, display_id, total, subtotal, tax_total, shipping_total, discount_total, status, payment_status, fulfillment_status, shipping_address, billing_address, items, shipping_methods, customer_email, email, metadata, created_at")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    console.error("Error fetching order:", error)
    return null
  }

  return data as Order
}