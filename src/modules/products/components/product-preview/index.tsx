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
import { Loader2, ShoppingBag } from "lucide-react"
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
  clubDiscountPercentage?: number
  showAction?: boolean
  isMinimal?: boolean
}

export default function ProductPreview({
  product,
  isFeatured,
  viewMode = "grid-4",
  clubDiscountPercentage,
  showAction = true,
  isMinimal = false,
}: ProductPreviewProps) {
  const isListView = viewMode === "list"
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<"idle" | "added" | "error">("idle")
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false)
  const cartSidebar = useOptionalCartSidebar()
  const openCart = cartSidebar?.openCart
  const { optimisticAdd } = useCartStore()

  const selectedVariantId = product.variants?.[0]?.id || null

  const selectedVariant = useMemo(() => {
    if (!selectedVariantId) return product.variants?.[0]
    return product.variants?.find((v) => v.id === selectedVariantId)
  }, [product.variants, selectedVariantId])

  // Use the central utility to calculate display price
  const { cheapestPrice } = useMemo(() => {
    return getProductPrice({ product, clubDiscountPercentage })
  }, [product, clubDiscountPercentage])

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

  const descriptionPreview =
    isListView && product.description ? product.description : undefined
  // Determine if product requires option selection
  const hasVariants =
    (product.variants?.length ?? 0) > 0 || (product.options?.length ?? 0) > 0

  // Check if product or selected variant is in stock
  const inStock = useMemo(() => {
    if (selectedVariant) {
      if (
        !selectedVariant.manage_inventory ||
        selectedVariant.allow_backorder
      ) {
        return true
      }
      return (selectedVariant.inventory_quantity ?? 0) > 0
    }
    // Fallback to product stock count for simple products
    return (product.stock_count || 0) > 0
  }, [product.stock_count, selectedVariant])

  const buttonLabel =
    status === "added"
      ? "Added!"
      : status === "error"
      ? "Try again"
      : !inStock
      ? "Out of stock"
      : hasVariants
      ? "View Options"
      : "Add to cart"

  const openQuickView = async (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsQuickViewOpen(true)
  }

  const handleAction = (event: MouseEvent) => {
    if (!inStock && !hasVariants) return // Do nothing if out of stock and no options to view

    if (hasVariants) {
      openQuickView(event)
      return
    }
    handleAddToCart(event)
  }

  const handleAddToCart = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()

    if (!inStock) return

    const startTime = performance.now()
    console.log(`[Product Card Add] Starting for ${product.name}...`)

    startTransition(async () => {
      setStatus("added")
      openCart?.()
      try {
        // Not awaiting to keep UI snappy
        optimisticAdd({
          product,
          variant: selectedVariant || product.variants?.[0],
          quantity: 1,
          countryCode: "in",
        })

        const endTime = performance.now()
        console.log(
          `[Product Card Add] Completed in ${(endTime - startTime).toFixed(
            2
          )}ms`
        )

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
              images={
                product.images
                  ? product.images.map((img) => ({
                      url: getImageUrl(img) || "",
                    }))
                  : []
              }
              size="full"
              isFeatured={isFeatured}
              className="h-full w-full rounded-2xl border-none bg-transparent p-0 shadow-none object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
            {/* Desktop Hover Actions (Top Right) */}
            {!isMinimal && (
              <div className="absolute right-3 top-3 translate-x-4 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 z-10 hidden sm:block">
                <WishlistButton
                  productId={product.id}
                  productTitle={product.name}
                />
              </div>
            )}

            {/* Mobile Actions Overlay (Bottom Right) */}
            {showAction && (
              <div className="absolute right-2 bottom-2 flex flex-col gap-2 z-20 sm:hidden">
                {!isMinimal && (
                  <WishlistButton
                    productId={product.id}
                    productTitle={product.name}
                  />
                )}
                <button
                  type="button"
                  onClick={handleAction}
                  disabled={isPending || (!inStock && !hasVariants)}
                  className={cn(
                    "rounded-full p-2 transition w-12 h-12 flex justify-center items-center shadow-sm",
                    !inStock && !hasVariants
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-white/90 text-ui-fg-muted hover:text-ui-fg-base"
                  )}
                >
                  {isPending ? (
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  ) : (
                    <ShoppingBag
                      className={cn(
                        "w-6 h-6",
                        !inStock && !hasVariants
                          ? "text-slate-300"
                          : "text-slate-900"
                      )}
                    />
                  )}
                </button>
              </div>
            )}
            {/* Overlay for hover effect */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-black/0 transition-colors duration-300 group-hover:bg-black/5" />

            {/* Hover Action Button */}
            {showAction && (
              <div className="absolute inset-x-0 bottom-0 p-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hidden sm:block z-20">
                <button
                  type="button"
                  onClick={handleAction}
                  className={cn(
                    "w-full rounded-full py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all",
                    !inStock && !hasVariants
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-white text-slate-900 hover:bg-primary hover:text-white"
                  )}
                  disabled={isPending || (!inStock && !hasVariants)}
                >
                  {isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    buttonLabel
                  )}
                </button>
              </div>
            )}
          </div>

          <div className={cn("flex flex-1 flex-col gap-1 mt-3")}>
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

            <div className="mt-auto flex items-start justify-between gap-2">
              <PreviewPrice price={cheapestPrice} />
            </div>
          </div>
        </LocalizedClientLink>
      </div>

      <ProductQuickViewModal
        product={product}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
      />
    </>
  )
}
