"use client"

import { Text } from "@modules/common/components/text"
import { cn } from "@lib/util/cn"
import { Product } from "@/lib/supabase/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getImageUrl } from "@lib/util/get-image-url"
import { ViewMode } from "@modules/store/components/refinement-list/types"
import WishlistButton from "@modules/products/components/wishlist-button"
import { useOptionalCartSidebar } from "@modules/layout/context/cart-sidebar-context"
import { useCartStore } from "@modules/cart/context/cart-store-context"
import SafeRichText from "@modules/common/components/safe-rich-text"
import { Loader2, ShoppingCart } from "lucide-react"
import ProductQuickViewModal from "./quick-view-modal"
import { getProductPrice } from "@lib/util/get-product-price"

import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"
import type { MouseEvent } from "react"
import { useState, useTransition, useMemo } from "react"

type ProductPreviewProps = {
  product: Product
  isFeatured?: boolean
  viewMode?: ViewMode
}

export default function ProductPreview({
  product,
  isFeatured,
  viewMode = "grid-4",
}: ProductPreviewProps) {
  const isListView = viewMode === "list"
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<"idle" | "added" | "error">("idle")
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false)
  const [isQuickViewLoading, setIsQuickViewLoading] = useState(false)
  const [quickViewProduct, setQuickViewProduct] = useState<Product>(product)
  const cartSidebar = useOptionalCartSidebar()
  const openCart = cartSidebar?.openCart
  const { optimisticAdd } = useCartStore()

  // Use the central utility to calculate display price
  const { cheapestPrice } = useMemo(() => {
    return getProductPrice({ product })
  }, [product])

  const cardClassName = cn(
    "group relative block overflow-hidden transition-all duration-300 h-full",
    {
      "flex flex-row gap-6": isListView,
    }
  )

  const imageWrapperClassName = cn(
    "relative w-full overflow-hidden rounded-2xl bg-gray-100",
    {
      "w-48 shrink-0 aspect-square": isListView,
      "aspect-square": !isListView,
    }
  )

  const titleSizeMap: Record<ViewMode, string> = {
    "grid-4": "text-base",
    "grid-5": "text-sm",
    list: "text-xl",
  }

  const titleClassName = cn(
    "font-semibold tracking-tight text-slate-900 group-hover:text-primary transition-colors",
    isListView ? "line-clamp-2" : "line-clamp-1",
    titleSizeMap[viewMode] ?? "text-base"
  )

  const descriptionPreview = isListView && product.description ? product.description : undefined
  const buttonLabel = status === "added" ? "Added!" : status === "error" ? "Try again" : "Add to cart"

  const openQuickView = async (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsQuickViewLoading(true)
    // Quick view logic...
    setIsQuickViewLoading(false)
    setIsQuickViewOpen(true)
  }

  const handleAddToCart = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()

    startTransition(async () => {
      setStatus("added")
      openCart?.()
      try {
        await optimisticAdd({
          product,
          variant: product.variants?.[0] || (product as any),
          quantity: 1,
          countryCode: "in",
        })
        setTimeout(() => setStatus("idle"), 2000)
      } catch (error) {
        console.error("Failed to add to cart", error)
        setStatus("error")
        setTimeout(() => setStatus("idle"), 2000)
      }
    })
  }

  return (
    <>
      <div className="h-full flex flex-col" data-testid="product-wrapper">
        <LocalizedClientLink
          href={`/products/${product.handle}`}
          className={cardClassName}
        >
          <div className={imageWrapperClassName}>
            <Thumbnail
              thumbnail={product.thumbnail || product.image_url}
              images={product.images ? product.images.map(img => ({ url: getImageUrl(img) || '' })) : []}
              size="full"
              isFeatured={isFeatured}
              className="h-full w-full rounded-2xl border-none bg-transparent p-0 shadow-none object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
            <div className="absolute right-3 top-3 translate-x-4 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 z-10">
              <WishlistButton
                productId={product.id}
                productTitle={product.name}
              />
            </div>
            {/* Overlay for hover effect */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-black/0 transition-colors duration-300 group-hover:bg-black/5" />
          </div>

          <div className={cn("flex flex-1 flex-col gap-2 mt-3")}>
            <div className="space-y-1">
              <Text className={titleClassName} data-testid="product-title">
                {product.name}
              </Text>

              {descriptionPreview && (
                <SafeRichText
                  html={descriptionPreview}
                  className="text-sm text-gray-500 line-clamp-2 rich-text-muted"
                />
              )}
            </div>

            <div className="mt-auto flex items-center justify-between gap-4">
              <PreviewPrice price={cheapestPrice} />

              <button
                type="button"
                onClick={handleAddToCart}
                className={cn(
                  "inline-flex items-center justify-center text-xs font-semibold text-white transition-all gap-0 sm:gap-2 rounded-full h-10 w-10 px-0 sm:h-9 sm:w-auto sm:px-4 bg-[#111827] hover:bg-primary shadow-sm hover:shadow-md active:scale-95"
                )}
                aria-label={buttonLabel}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <ShoppingCart className="h-4 w-4 sm:hidden" aria-hidden="true" />
                )}
                <span className="hidden sm:inline">{buttonLabel}</span>
              </button>
            </div>
          </div>
        </LocalizedClientLink>
      </div>

      <ProductQuickViewModal
        product={quickViewProduct}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
      />
    </>
  )
}