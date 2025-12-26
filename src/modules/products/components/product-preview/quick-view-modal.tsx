"use client"

import { HttpTypes } from "@medusajs/types"
import { X } from "lucide-react"
import Modal from "@modules/common/components/modal"
import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { DEFAULT_COUNTRY_CODE } from "@lib/constants/region"
import { useEffect, useMemo, useState } from "react"

type ProductQuickViewModalProps = {
  product: HttpTypes.StoreProduct
  isOpen: boolean
  onClose: () => void
}

const ProductQuickViewModal = ({
  product,
  isOpen,
  onClose,
}: ProductQuickViewModalProps) => {
  const [hydratedProduct, setHydratedProduct] =
    useState<HttpTypes.StoreProduct | null>(null)

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
          setHydratedProduct(product)
          return
        }

        const payload = (await response.json()) as {
          products?: HttpTypes.StoreProduct[]
        }

        const nextProduct = payload.products?.[0]
        setHydratedProduct(nextProduct ?? product)
      } catch (error) {
        if ((error as Error).name === "AbortError") return
        setHydratedProduct(product)
      }
    }

    loadProduct()
    return () => controller.abort()
  }, [isOpen, product])

  const resolvedProduct = hydratedProduct ?? product

  const galleryImages: HttpTypes.StoreProductImage[] = useMemo(() => {
    const candidate = (resolvedProduct.images ?? []).map((image) => ({
      ...image,
      rank: image.rank ?? 0,
    }))

    if (candidate.length) return candidate

    if (resolvedProduct.thumbnail) {
      return [
        {
          id: `${resolvedProduct.id}-thumbnail`,
          url: resolvedProduct.thumbnail,
          created_at: "",
          updated_at: "",
          deleted_at: null,
          metadata: null,
          rank: 0,
        } satisfies HttpTypes.StoreProductImage,
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
      panelClassName="border-none shadow-none bg-white w-full h-full max-h-screen max-w-none rounded-none md:max-w-5xl md:h-auto md:max-h-[90vh] md:rounded-xl"
      data-testid="product-quick-view-modal"
    >
      <div className="relative flex h-full max-h-screen w-full flex-col overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
          aria-label="Close quick view"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex-1 overflow-y-auto md:overflow-visible">
          <div className="flex flex-col gap-0 md:grid md:grid-cols-[1.05fr,1fr] xl:grid-cols-[1.1fr,0.9fr] md:gap-6">
            <div className="relative w-full md:max-h-[57vh] overflow-hidden">
              <ImageGallery images={galleryImages} variant="modal" />
            </div>

            <div className="flex flex-col md:max-h-[57vh] md:overflow-hidden pb-4 md:pb-0 px-4 md:px-0">
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
