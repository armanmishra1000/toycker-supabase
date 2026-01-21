"use server"

import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import { Order } from "@/lib/supabase/types"
import { getAuthUser } from "./auth"

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