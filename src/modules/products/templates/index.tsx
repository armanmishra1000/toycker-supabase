import React, { Suspense } from "react"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import Breadcrumbs from "@modules/common/components/breadcrumbs"
import LazyLoadSection from "@modules/common/components/lazy-load-section"
import { notFound } from "next/navigation"
import { Product, Region } from "@/lib/supabase/types"

import ProductActionsWrapper from "./product-actions-wrapper"
import CustomerReviews from "@modules/products/components/customer-reviews"
import OrderInformation from "@modules/products/components/order-information"
import RecentlyViewedTracker from "@modules/products/components/recently-viewed-tracker"
import { getProductReviews } from "@/lib/actions/reviews"
import FrequentlyBoughtTogether from "@modules/products/components/frequently-bought-together"

import { retrieveCustomer } from "@lib/data/customer"
import { getYoutubeId, getYoutubeEmbedUrl } from "@/lib/util/youtube"

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

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://toycker.com"

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": images.map(i => i.url),
    "description": product.seo_description || product.description || product.short_description || product.name,
    "sku": product.variants?.[0]?.sku || product.id,
    "brand": {
      "@type": "Brand",
      "name": "Toycker"
    },
    "offers": {
      "@type": "Offer",
      "url": `${baseUrl}/products/${product.handle}`,
      "priceCurrency": "INR",
      "price": product.price,
      "availability": product.stock_count > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Toycker"
      }
    }
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": baseUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Store",
        "item": `${baseUrl}/store`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": product.name,
        "item": `${baseUrl}/products/${product.handle}`
      }
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div
        className="content-container py-6 lg:py-10"
        data-testid="product-container"
      >
        <Breadcrumbs className="hidden small:block mb-6" items={[{ label: "Store", href: "/store" }, { label: product.name }]} />
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
                product={product}
                region={region}
                clubDiscountPercentage={clubDiscountPercentage}
              />
            </Suspense>
            <div className="mt-6">
              <OrderInformation />
              {(() => {
                const videoId = getYoutubeId(product.video_url)
                const embedUrl = getYoutubeEmbedUrl(videoId)

                if (!embedUrl) return null

                return (
                  <div className="mt-6 aspect-video w-full overflow-hidden rounded-xl border border-slate-200">
                    <iframe
                      width="100%"
                      height="100%"
                      src={embedUrl}
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

        {/* Lazy load product details sections */}
        <div className="mt-8 space-y-5">
          <FrequentlyBoughtTogether
            product={product}
            clubDiscountPercentage={clubDiscountPercentage}
          />
          <LazyLoadSection minHeight="300px">
            <ProductTabs product={product} />
          </LazyLoadSection>

          <LazyLoadSection minHeight="400px">
            <CustomerReviews productId={product.id} reviews={reviews} customer={customer} />
          </LazyLoadSection>

        </div>
      </div >

      {/* Lazy load related products */}
      <LazyLoadSection minHeight="500px">
        <div
          className="content-container mb-10"
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
      </LazyLoadSection>

      <RecentlyViewedTracker productId={product.id} />
    </>
  )
}

export default ProductTemplate