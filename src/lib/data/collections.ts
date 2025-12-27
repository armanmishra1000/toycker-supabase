"use server"

import { createClient } from "@/lib/supabase/server"

export interface Collection {
  id: string
  title: string
  handle: string
  created_at: string
}

export const listCollections = async () => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("collections")
    .select("*")

  if (error) {
    console.error("Error fetching collections:", error)
    return { collections: [], count: 0 }
  }

  return { collections: data as Collection[], count: data.length }
}

export const getCollectionByHandle = async (handle: string) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .eq("handle", handle)
    .single()

  if (error) {
    console.error("Error fetching collection:", error)
    return null
  }

  return data as Collection
}
