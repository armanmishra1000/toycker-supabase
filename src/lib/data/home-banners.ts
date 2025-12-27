"use server"

export type HomeHeroBanner = {
  id: string
  image_url: string
  alt_text: string | null
  sort_order: number | null
  starts_at: string | null
  ends_at: string | null
}

const STATIC_BANNERS: HomeHeroBanner[] = [
  {
    id: "banner-1",
    image_url: "/assets/images/slider_default.png",
    alt_text: "Welcome to Toycker",
    sort_order: 1,
    starts_at: null,
    ends_at: null,
  }
]

export const listHomeBanners = async (): Promise<HomeHeroBanner[]> => {
  // In a real implementation, you might fetch this from Supabase 'banners' table
  return STATIC_BANNERS
}