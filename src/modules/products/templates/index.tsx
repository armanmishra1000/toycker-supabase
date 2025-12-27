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

type ProductTemplateProps = {
  product: Product
  region: Region
  countryCode: string
  images: { url: string }[]
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  images,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  return (
    <>
      <div
        className="content-container py-6 lg:py-10"
        data-testid="product-container"
      >
        <Breadcrumbs className="mb-6" items={[{ label: "Store", href: "/store" }, { label: product.name }]} />
        <div className="flex flex-col gap-10 xl:flex-row xl:items-start">
          <div className="w-full xl:w-3/5">
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
              />
            </Suspense>
            <div className="mt-6">
              <OrderInformation />
            </div>
          </div>
        </div>
        <div className="mt-8 space-y-5">
          <ProductTabs product={product} />
          <CustomerReviews />
        </div>
      </div>
      <div
        className="content-container my-16"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
      <RecentlyViewedTracker productId={product.id} />
    </>
  )
}

export default ProductTemplate