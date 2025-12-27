"use server"

import { createClient } from "@/lib/supabase/server"

export interface Category {
  id: string
  name: string
  handle: string
  description: string | null
  parent_category_id: string | null
  created_at: string
}

export const listCategories = async () => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("categories")
    .select("*")

  if (error) {
    console.error("Error fetching categories:", error)
    return []
  }

  return data as Category[]
}

export const getCategoryByHandle = async (categoryHandle: string[]) => {
  const handle = categoryHandle[categoryHandle.length - 1]
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("handle", handle)
    .single()

  if (error) {
    console.error("Error fetching category:", error)
    return null
  }

  return data as Category
}
