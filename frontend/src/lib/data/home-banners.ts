"use server"

import { sdk } from "@lib/config"

import { getAuthHeaders, getCacheOptions } from "./cookies"

export type HomeHeroBanner = {
  id: string
  image_url: string
  alt_text: string | null
  sort_order: number | null
  starts_at: string | null
  ends_at: string | null
}

const HOME_BANNERS_REVALIDATE_SECONDS = (() => {
  const raw = process.env.NEXT_PUBLIC_HOME_BANNERS_REVALIDATE

  if (!raw) {
    return 300
  }

  const normalized = raw.trim().toLowerCase()

  if (["0", "false", "off", "disable", "disabled"].includes(normalized)) {
    return 0
  }

  const parsed = Number(raw)
  if (Number.isFinite(parsed) && parsed >= 0) {
    return parsed
  }

  return 300
})()

const buildCacheConfig = async (tag: string) => {
  if (HOME_BANNERS_REVALIDATE_SECONDS <= 0) {
    return { cache: "no-store" as const }
  }

  const cacheOptions = await getCacheOptions(tag)

  return {
    cache: "force-cache" as const,
    next: {
      revalidate: HOME_BANNERS_REVALIDATE_SECONDS,
      ...(cacheOptions as { tags?: string[] }),
    },
  }
}

export const listHomeBanners = async (): Promise<HomeHeroBanner[]> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  try {
    const cacheConfig = await buildCacheConfig("home-hero-banners")
    const payload = await sdk.client.fetch<{ banners: HomeHeroBanner[] }>("/store/home-banners", {
      method: "GET",
      headers,
      cache: cacheConfig.cache,
      ...(cacheConfig.next ? { next: cacheConfig.next } : {}),
    })

    return payload.banners ?? []
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Unable to load home banners", error)
    }
    return []
  }
}
