import { Metadata } from "next"
import { Suspense } from "react"
import Hero from "@modules/home/components/hero"
import ShopByAge from "@modules/home/components/shop-by-age"
import ReviewMediaHub from "@modules/home/components/review-media-hub"
import WhyChooseUs from "@modules/home/components/why-choose-us"
import CategoryMarquee from "@modules/home/components/category-marquee"
import PopularToySet from "@modules/home/components/popular-toy-set"
import ExclusiveCollections from "@modules/home/components/exclusive-collections"
import BestSelling from "@modules/home/components/best-selling"
import ProductGridSkeleton from "@modules/common/components/skeleton/product-grid-skeleton"
import LazyLoadSection from "@modules/common/components/lazy-load-section"
import { listHomeBanners } from "@lib/data/home-banners"
import { listExclusiveCollections } from "@lib/data/exclusive-collections"
import { getRegion } from "@lib/data/regions"

export const metadata: Metadata = {
  title: "Toycker | Premium Toys for Kids",
  description: "Discover a wide range of premium toys for kids of all ages.",
}

// Removed 'export const revalidate = 60' to make page truly static
// Page is now pre-rendered at build time and served from CDN edge

export default async function Home() {
  const countryCode = "in"

  // Static data fetching only - NO dynamic APIs (cookies, headers, etc.)
  // Club discount moved to environment variable for true static rendering
  const [banners, exclusiveItems, region] = await Promise.all([
    listHomeBanners(),
    listExclusiveCollections({ regionId: "reg_india" }),
    getRegion(),
  ])

  // Production-grade: Use environment variable instead of database query
  // This makes the page truly static and cacheable at CDN edge
  const clubDiscountPercentage = parseInt(
    process.env.NEXT_PUBLIC_CLUB_DISCOUNT_PERCENTAGE || '10'
  )

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