"use server"

import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import { Category } from "@/lib/supabase/types"

export const listCategories = cache(async (): Promise<Category[]> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("categories")
    .select("*")

  if (error) {
    console.error("Error fetching categories:", error)
    return []
  }

  return data as Category[]
})

export const getCategoryByHandle = cache(async (categoryHandle: string[]): Promise<Category | null> => {
  const handle = categoryHandle[categoryHandle.length - 1]
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("handle", handle)
    .maybeSingle()

  if (error) {
    // Only log if it's not a 'no rows' error to keep build logs clean
    if (error.code !== 'PGRST116') {
      console.error("Error fetching category:", error)
    }
    return null
  }

  return data as Category
})