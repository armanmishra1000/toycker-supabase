import { Metadata } from "next"
import { cookies } from "next/headers"
import Hero from "@modules/home/components/hero"
import ShopByAge from "@modules/home/components/shop-by-age"
import ReviewMediaHub from "@modules/home/components/review-media-hub"
import WhyChooseUs from "@modules/home/components/why-choose-us"
import CategoryMarquee from "@modules/home/components/category-marquee"
import PopularToySet from "@modules/home/components/popular-toy-set"
import ExclusiveCollections from "@modules/home/components/exclusive-collections"
import BestSelling from "@modules/home/components/best-selling"
import { listHomeBanners } from "@lib/data/home-banners"
import { listExclusiveCollections } from "@lib/data/exclusive-collections"
import { getRegion } from "@lib/data/regions"
import { retrieveCustomer } from "@lib/data/customer"
import { getClubSettings } from "@lib/data/club"

export const metadata: Metadata = {
  title: "Toycker | Premium Toys for Kids",
  description: "Discover a wide range of premium toys for kids of all ages.",
}

export const revalidate = 60

export default async function Home() {
  const countryCode = "in"

  const [banners, exclusiveItems, region, customer, clubSettings] = await Promise.all([
    listHomeBanners(),
    listExclusiveCollections({ regionId: "reg_india" }),
    getRegion(),
    retrieveCustomer(),
    getClubSettings()
  ])

  const isCustomerLoggedIn = Boolean(customer)
  const clubDiscountPercentage = clubSettings?.discount_percentage

  return (
    <>
      <Hero banners={banners} />
      <CategoryMarquee />

      <PopularToySet
        regionId={region.id}
        countryCode={countryCode}
        isCustomerLoggedIn={isCustomerLoggedIn}
        clubDiscountPercentage={clubDiscountPercentage}
      />

      <ShopByAge />

      <ExclusiveCollections
        items={exclusiveItems}
        clubDiscountPercentage={clubDiscountPercentage}
      />

      <BestSelling
        regionId={region.id}
        countryCode={countryCode}
        isCustomerLoggedIn={isCustomerLoggedIn}
        clubDiscountPercentage={clubDiscountPercentage}
      />

      <ReviewMediaHub />
      <WhyChooseUs />
    </>
  )
}