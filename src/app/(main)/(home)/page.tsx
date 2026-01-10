import { Metadata } from "next"
import { Suspense } from "react"
import dynamic from "next/dynamic"
import CategoryMarquee from "@modules/home/components/category-marquee"
import PopularToySet from "@modules/home/components/popular-toy-set"
import BestSelling from "@modules/home/components/best-selling"
import ProductGridSkeleton from "@modules/common/components/skeleton/product-grid-skeleton"
import LazyLoadSection from "@modules/common/components/lazy-load-section"

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

import HeroServer from "@modules/home/components/hero/server"
import ExclusiveCollectionsServer from "@modules/home/components/exclusive-collections/server"

export default async function Home() {
  return (
    <>
      {/* Above-the-fold content - streams in immediately */}
      <Suspense fallback={<div className="w-full md:px-4 md:py-8 aspect-[16/9] animate-pulse bg-ui-bg-subtle md:rounded-2xl" />}>
        <HeroServer />
      </Suspense>

      <CategoryMarquee />

      {/* Product sections - independently streamed with skeleton fallbacks */}
      <Suspense fallback={<ProductGridSkeleton title="Explore" subtitle="Explore Popular Toy Set" count={10} className="bg-primary/10" />}>
        <PopularToySet />
      </Suspense>

      <LazyLoadSection minHeight="400px">
        <ShopByAge />
      </LazyLoadSection>

      <Suspense fallback={<div className="h-[500px] animate-pulse bg-ui-bg-subtle" />}>
        <LazyLoadSection minHeight="500px">
          <ExclusiveCollectionsServer />
        </LazyLoadSection>
      </Suspense>

      <Suspense fallback={<ProductGridSkeleton title="Curated" subtitle="Best Selling Picks" count={10} className="bg-white" />}>
        <BestSelling />
      </Suspense>

      <LazyLoadSection minHeight="500px">
        <ReviewMediaHub />
      </LazyLoadSection>

      <LazyLoadSection minHeight="400px">
        <WhyChooseUs />
      </LazyLoadSection>
    </>
  )
}