import React, { Suspense } from "react"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import Breadcrumbs from "@modules/common/components/breadcrumbs"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import ProductActionsWrapper from "./product-actions-wrapper"
import CustomerReviews from "@modules/products/components/customer-reviews"
import OrderInformation from "@modules/products/components/order-information"
import RecentlyViewedTracker from "@modules/products/components/recently-viewed-tracker"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
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
        <Breadcrumbs className="mb-6" items={getProductBreadcrumbs(product)} />
        <div className="flex flex-col gap-10 xl:flex-row xl:items-start">
          <div className="w-full xl:w-3/5">
            <ImageGallery images={images} />
          </div>
          <div className="w-full xl:w-2/5">
            <Suspense
              fallback={<ProductActions disabled={true} product={product} />}
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

const getProductBreadcrumbs = (product: HttpTypes.StoreProduct) => {
  return [{ label: product.title }]
}
