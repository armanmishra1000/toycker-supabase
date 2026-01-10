"use server"

import { createClient } from "@/lib/supabase/server"

export type HomeHeroBanner = {
  id: string
  title: string
  image_url: string
  alt_text: string | null
  link_url: string | null
  sort_order: number
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
}

export const listHomeBanners = async (): Promise<HomeHeroBanner[]> => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("home_banners")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  if (error) {
    console.warn("Error fetching home banners:", error)
    return []
  }

  if (!data || data.length === 0) {
    return []
  }

  // Filter banners based on schedule (starts_at and ends_at)
  const now = new Date()
  const scheduledBanners = data.filter((banner) => {
    const startsAt = banner.starts_at ? new Date(banner.starts_at) : null
    const endsAt = banner.ends_at ? new Date(banner.ends_at) : null

    // If starts_at is set and current time is before it, skip
    if (startsAt && now < startsAt) return false

    // If ends_at is set and current time is after it, skip
    if (endsAt && now > endsAt) return false

    return true
  })

  return scheduledBanners as HomeHeroBanner[]
}