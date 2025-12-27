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
    image_url: "https://cdn.toycker.in/uploads/1765626345675-465768789-4dd9-46f4-545fxc-645rhd42bg4542-01KCBRFYF4K7W4TF6RDR58M1AD.png",
    alt_text: "Toycker Promo 1",
    sort_order: 1,
    starts_at: null,
    ends_at: null,
  },
  {
    id: "banner-2",
    image_url: "https://cdn.toycker.in/uploads/1765626600788-3243254765tgdcgu65d3w5gj65-v3e57hd532gf-vscxa53242-01KCBRQQK777ERY8PRKKFKESXB.png",
    alt_text: "Toycker Promo 2",
    sort_order: 2,
    starts_at: null,
    ends_at: null,
  },
  {
    id: "banner-3",
    image_url: "https://cdn.toycker.in/uploads/1765626230819-12c72c17-4dd9-46f4-8db0-188324c9d1f8-01KCBRCE9S5GFP49F2XCZT0WXJ.png",
    alt_text: "Toycker Promo 3",
    sort_order: 3,
    starts_at: null,
    ends_at: null,
  },
  {
    id: "banner-4",
    image_url: "https://cdn.toycker.in/uploads/1765626092967-d894554c-013e-4c2e-a7a1-b0b566051f5e-01KCBR87VAB5HYPH8JEERWE54A.png",
    alt_text: "Toycker Promo 4",
    sort_order: 4,
    starts_at: null,
    ends_at: null,
  },
  {
    id: "banner-5",
    image_url: "https://cdn.toycker.in/uploads/1765626805355-243454656453-6tdvxcsf-7648674355-vdsf2465dghfbnmlkyafd-535-01KCBRXZCKE9FVA1YN42ZT433B.png",
    alt_text: "Toycker Promo 5",
    sort_order: 5,
    starts_at: null,
    ends_at: null,
  },
  {
    id: "banner-6",
    image_url: "https://cdn.toycker.in/uploads/1765626695781-edydnaidoi3764365281324-654364525645-fsfd4631245gds4232-01KCBRTMDQDY37SSPBCPNQY3YD.png",
    alt_text: "Toycker Promo 6",
    sort_order: 6,
    starts_at: null,
    ends_at: null,
  }
]

export const listHomeBanners = async (): Promise<HomeHeroBanner[]> => {
  return STATIC_BANNERS
}