import { Metadata } from "next"
import { cookies } from "next/headers"

import ExclusiveCollections from "@modules/home/components/exclusive-collections"
import Hero from "@modules/home/components/hero"
import PopularToySet from "@modules/home/components/popular-toy-set"
import BestSelling from "@modules/home/components/best-selling"
import ShopByAge from "@modules/home/components/shop-by-age"
import ReviewMediaHub from "@modules/home/components/review-media-hub"
import WhyChooseUs from "@modules/home/components/why-choose-us"
import CategoryMarquee from "@modules/home/components/category-marquee"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import { listExclusiveCollections } from "@lib/data/exclusive-collections"
import { listHomeBanners } from "@lib/data/home-banners"
import type { HttpTypes } from "@medusajs/types"

export const metadata: Metadata = {
  title: "Medusa Next.js Starter Template",
  description:
    "A performant frontend ecommerce starter template with Next.js 15 and Medusa.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  const [region, collectionsResult, homeBanners] = await Promise.all([
    getRegion(countryCode),
    listCollections({
      fields: "id, handle, title",
    }),
    listHomeBanners(),
  ])

  const cookieStore = await cookies()

  const collections = (collectionsResult?.collections ?? []) as HttpTypes.StoreCollection[]
  const isCustomerLoggedIn = Boolean(cookieStore.get("_medusa_jwt"))

  if (!collections.length || !region) {
    return null
  }

  const exclusiveCollections = await listExclusiveCollections({
    regionId: region.id,
  })

  const popularCollection = collections.find((collection) => collection.handle === "popular")
  const bestSellingCollection = collections.find((collection) => collection.handle === "best-selling")

  return (
    <>
      <Hero banners={homeBanners} />
      <CategoryMarquee />
      <PopularToySet
        regionId={region.id}
        countryCode={countryCode}
        isCustomerLoggedIn={isCustomerLoggedIn}
        collectionId={popularCollection?.id}
      />
      <ShopByAge />
      {exclusiveCollections.length > 0 && <ExclusiveCollections items={exclusiveCollections} />}
      <BestSelling
        regionId={region.id}
        countryCode={countryCode}
        isCustomerLoggedIn={isCustomerLoggedIn}
        collectionId={bestSellingCollection?.id}
      />
      <ReviewMediaHub />
      <WhyChooseUs />
    </>
  )
}
