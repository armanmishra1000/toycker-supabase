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
    alt_text: "Dino-Mite Toy Adventure",
    sort_order: 1,
    starts_at: null,
    ends_at: null,
  },
  {
    id: "banner-2",
    image_url: "/assets/images/frictions-airplanes.jpg", // Using an existing image as placeholder for the second banner seen in screenshot
    alt_text: "Monster Truck Toy Smashup",
    sort_order: 2,
    starts_at: null,
    ends_at: null,
  }
]

export const listHomeBanners = async (): Promise<HomeHeroBanner[]> => {
  return STATIC_BANNERS
}