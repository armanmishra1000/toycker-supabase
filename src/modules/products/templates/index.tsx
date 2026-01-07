import React, { Suspense } from "react"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import Breadcrumbs from "@modules/common/components/breadcrumbs"
import { notFound } from "next/navigation"
import { Product, Region } from "@/lib/supabase/types"

import ProductActionsWrapper from "./product-actions-wrapper"
import CustomerReviews from "@modules/products/components/customer-reviews"
import OrderInformation from "@modules/products/components/order-information"
import RecentlyViewedTracker from "@modules/products/components/recently-viewed-tracker"
import { getProductReviews } from "@/lib/actions/reviews"

import { retrieveCustomer } from "@lib/data/customer"

type ProductTemplateProps = {
  product: Product
  region: Region
  countryCode: string
  images: { url: string }[]
  clubDiscountPercentage?: number
}

const ProductTemplate = async ({
  product,
  region,
  countryCode,
  images,
  clubDiscountPercentage,
}: ProductTemplateProps) => {
  if (!product || !product.id) {
    return notFound()
  }

  const customer = await retrieveCustomer()
  const reviews = await getProductReviews(product.id)

  return (
    <>
      <div
        className="content-container py-6 lg:py-10"
        data-testid="product-container"
      >
        <Breadcrumbs className="mb-6" items={[{ label: "Store", href: "/store" }, { label: product.name }]} />
        <div className="flex flex-col gap-10 xl:flex-row xl:items-start">
          <div className="w-full xl:w-3/5 xl:sticky xl:top-[120px] self-start">
            <ImageGallery images={images} />
          </div>
          <div className="w-full xl:w-2/5">
            <Suspense
              fallback={
                <div className="flex flex-col gap-y-4 animate-pulse">
                  <div className="h-10 w-3/4 bg-gray-100 rounded" />
                  <div className="h-6 w-1/2 bg-gray-100 rounded" />
                  <div className="h-24 w-full bg-gray-100 rounded" />
                </div>
              }
            >
              <ProductActionsWrapper
                id={product.id}
                region={region}
                clubDiscountPercentage={clubDiscountPercentage}
              />
            </Suspense>
            <div className="mt-6">
              <OrderInformation />
              {(() => {
                if (!product.video_url) return null
                
                // Simple ID extraction for standard formats
                let videoId = ""
                try {
                   const url = new URL(product.video_url)
                   if (url.hostname.includes("youtube.com")) {
                     videoId = url.searchParams.get("v") || ""
                   } else if (url.hostname.includes("youtu.be")) {
                     videoId = url.pathname.slice(1)
                   }
                } catch (e) {
                  // Fallback if full URL parsing fails or is just an ID
                  videoId = product.video_url 
                }

                if (!videoId) return null

                return (
                  <div className="mt-6 aspect-video w-full overflow-hidden rounded-xl border border-slate-200">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${videoId}`}
                      title="Product Video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="border-0"
                    />
                  </div>
                )
              })()}
            </div>
          </div>
        </div >
        <div className="mt-8 space-y-5">
          <ProductTabs product={product} />
          <CustomerReviews productId={product.id} reviews={reviews} customer={customer} />
        </div>
      </div >
      <div
        className="content-container my-16"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts
            product={product}
            countryCode={countryCode}
            clubDiscountPercentage={clubDiscountPercentage}
          />
        </Suspense>
      </div>
      <RecentlyViewedTracker productId={product.id} />
    </>
  )
}

export default ProductTemplate