"use server"

import { createClient } from "@/lib/supabase/server"

export async function listProducts() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching products:", error)
    return []
  }

  return data
}

export async function getProductByHandle(handle: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .filter("handle", "eq", handle)
    .single()

  if (error) {
    console.error("Error fetching product:", error)
    return null
  }

  return data
}
