"use server"

import { createClient } from "@/lib/supabase/server"
import { Product } from "@/lib/supabase/types"

export const retrieveVariant = async (
  variant_id: string
): Promise<any | null> => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("product_variants")
    .select("*")
    .eq("id", variant_id)
    .single()

  if (error) {
    console.error("Error fetching variant:", error)
    return null
  }

  return data
}
