import { Metadata } from "next"
import { Suspense } from "react"
import dynamic from "next/dynamic"
import Hero from "@modules/home/components/hero"
import CategoryMarquee from "@modules/home/components/category-marquee"
import PopularToySet from "@modules/home/components/popular-toy-set"
import ExclusiveCollections from "@modules/home/components/exclusive-collections"
import BestSelling from "@modules/home/components/best-selling"
import ProductGridSkeleton from "@modules/common/components/skeleton/product-grid-skeleton"
import LazyLoadSection from "@modules/common/components/lazy-load-section"
import { listHomeBanners } from "@lib/data/home-banners"
import { listExclusiveCollections } from "@lib/data/exclusive-collections"
import { getRegion } from "@lib/data/regions"
import { getClubSettings } from "@lib/data/club"

// Dynamically import below-the-fold components to reduce initial JS weight
const ShopByAge = dynamic(() => import("@modules/home/components/shop-by-age"), {
  loading: () => <div className="h-[400px] animate-pulse bg-ui-bg-subtle" />
})
const ReviewMediaHub = dynamic(() => import("@modules/home/components/review-media-hub"), {
  loading: () => <div className="h-[500px] animate-pulse bg-ui-bg-subtle" />
})
const WhyChooseUs = dynamic(() => import("@modules/home/components/why-choose-us"))

export const metadata: Metadata = {
  title: "Toycker | Premium Toys for Kids",
  description: "Discover a wide range of premium toys for kids of all ages.",
}

export default async function Home() {
  const countryCode = "in"

  // Fetch critical data in parallel
  const [banners, exclusiveItems, region, clubSettings] = await Promise.all([
    listHomeBanners(),
    listExclusiveCollections({ regionId: "reg_india" }),
    getRegion(),
    getClubSettings(),
  ])

  const clubDiscountPercentage = clubSettings?.discount_percentage

  return (
    <>
      {/* Above-the-fold content - loads instantly */}
      <Hero banners={banners} />
      <CategoryMarquee />

      {/* Product sections - stream in with skeleton fallbacks */}
      <LazyLoadSection minHeight="600px">
        <Suspense fallback={<ProductGridSkeleton title="Explore" subtitle="Explore Popular Toy Set" count={10} className="bg-primary/10" />}>
          <PopularToySet
            regionId={region.id}
            countryCode={countryCode}
            clubDiscountPercentage={clubDiscountPercentage}
          />
        </Suspense>
      </LazyLoadSection>

      <LazyLoadSection minHeight="400px">
        <ShopByAge />
      </LazyLoadSection>

      <LazyLoadSection minHeight="500px">
        <ExclusiveCollections
          items={exclusiveItems}
          clubDiscountPercentage={clubDiscountPercentage}
        />
      </LazyLoadSection>

      <LazyLoadSection minHeight="600px">
        <Suspense fallback={<ProductGridSkeleton title="Curated" subtitle="Best Selling Picks" count={10} className="bg-white" />}>
          <BestSelling
            regionId={region.id}
            countryCode={countryCode}
            clubDiscountPercentage={clubDiscountPercentage}
          />
        </Suspense>
      </LazyLoadSection>

      <LazyLoadSection minHeight="500px">
        <ReviewMediaHub />
      </LazyLoadSection>

      <LazyLoadSection minHeight="400px">
        <WhyChooseUs />
      </LazyLoadSection>
    </>
  )
}