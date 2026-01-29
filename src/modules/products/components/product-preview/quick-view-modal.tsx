"use client"

import { Product } from "@/lib/supabase/types"
import { getImageUrl } from "@lib/util/get-image-url"
import { X } from "lucide-react"
import Modal from "@modules/common/components/modal"
import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { DEFAULT_COUNTRY_CODE } from "@lib/constants/region"
import { useEffect, useMemo, useState } from "react"
import { fixUrl } from "@lib/util/images"

type ProductQuickViewModalProps = {
  product: Product
  isOpen: boolean
  onClose: () => void
}

const ProductQuickViewModal = ({
  product,
  isOpen,
  onClose,
}: ProductQuickViewModalProps) => {
  const [hydratedProduct, setHydratedProduct] =
    useState<Product | null>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    if (
      (product.options?.length ?? 0) > 0 &&
      product.variants?.some((variant) => (variant?.options?.length ?? 0) > 0)
    ) {
      setHydratedProduct(product)
      return
    }

    const controller = new AbortController()
    const loadProduct = async () => {
      try {
        const response = await fetch("/api/storefront/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            countryCode: DEFAULT_COUNTRY_CODE,
            limit: 1,
            productsIds: [product.id],
          }),
          signal: controller.signal,
        })

        if (!response.ok) {
          if (!controller.signal.aborted) {
            setHydratedProduct(product)
          }
          return
        }

        const payload = (await response.json()) as {
          products?: Product[]
        }

        if (!controller.signal.aborted) {
          const nextProduct = payload.products?.[0]
          setHydratedProduct(nextProduct ?? product)
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setHydratedProduct(product)
        }
      }
    }

    loadProduct()
    return () => {
      controller.abort("component_unmounted_or_product_changed")
    }
  }, [isOpen, product])

  const resolvedProduct = hydratedProduct ?? product

  const galleryImages = useMemo(() => {
    // Assuming supabase product has images as string[] or object[]
    const images = (resolvedProduct.images ?? []).map((img, index) => ({
      id: `${resolvedProduct.id}-image-${index}`,
      url: getImageUrl(img) || '',
    }))

    if (images.length) return images

    if (resolvedProduct.thumbnail) {
      return [
        {
          id: `${resolvedProduct.id}-thumbnail`,
          url: fixUrl(resolvedProduct.thumbnail) || '',
        },
      ]
    }

    return []
  }, [resolvedProduct])

  if (!resolvedProduct) {
    return null
  }

  return (
    <Modal
      isOpen={isOpen}
      close={onClose}
      size="xlarge"
      panelPadding="none"
      roundedSize="none"
      overflowHidden
      panelClassName="!border-none !shadow-none bg-white w-full h-full max-h-screen max-w-none rounded-none md:max-w-5xl md:h-auto md:max-h-[90vh] md:rounded-xl"
      data-testid="product-quick-view-modal"
    >
      <div className="relative flex h-full max-h-screen w-full flex-col overflow-hidden">
        {/* Mobile-only Close Button (Top Right) */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-slate-900 shadow-lg border border-white/20 transition hover:bg-white md:hidden"
          aria-label="Close quick view"
        >
          <X className="h-6 w-6" />
        </button>


        <div className="flex-1 overflow-y-auto md:overflow-visible">
          <div className="flex flex-col gap-0 md:grid md:grid-cols-[1.05fr,1fr] xl:grid-cols-[1.1fr,0.9fr] md:gap-6">
            <div className="relative w-full md:max-h-[57vh] overflow-hidden">
              <ImageGallery images={galleryImages} variant="modal" />
            </div>

            <div className="flex flex-col md:max-h-[57vh] md:overflow-hidden pb-4 md:pb-0 px-4 md:px-0">
              <div className="hidden md:flex justify-end p-1 pr-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="z-30 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
                  aria-label="Close quick view"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="md:flex-1 md:overflow-y-auto pr-1 pt-3 md:pt-1">
                <ProductActions
                  product={resolvedProduct}
                  showSupportActions={false}
                  syncVariantParam={false}
                  onActionComplete={onClose}
                />
              </div>
              <div className="mt-4 border-t pt-4">
                <LocalizedClientLink
                  href={`/products/${resolvedProduct.handle}`}
                  className="text-sm font-semibold text-slate-900 underline"
                >
                  View Full Details &gt;&gt;
                </LocalizedClientLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default ProductQuickViewModal