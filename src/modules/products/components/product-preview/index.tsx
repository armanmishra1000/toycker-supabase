"use client"

import { Text, clx } from "@medusajs/ui"
import { DEFAULT_COUNTRY_CODE } from "@lib/constants/region"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ViewMode } from "@modules/store/components/refinement-list/types"
import WishlistButton from "@modules/products/components/wishlist-button"
import { useOptionalCartSidebar } from "@modules/layout/context/cart-sidebar-context"
import { useCartStore } from "@modules/cart/context/cart-store-context"
import SafeRichText from "@modules/common/components/safe-rich-text"
import { Loader2, ShoppingCart } from "lucide-react"
import ProductQuickViewModal from "./quick-view-modal"

import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"
import type { MouseEvent } from "react"
import { useMemo, useState, useTransition } from "react"

type ProductPreviewProps = {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  viewMode?: ViewMode
}

export default function ProductPreview({
  product,
  isFeatured,
  viewMode = "grid-4",
}: ProductPreviewProps) {
  const { cheapestPrice } = getProductPrice({ product })
  const isListView = viewMode === "list"
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<"idle" | "added" | "error">("idle")
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false)
  const [isQuickViewLoading, setIsQuickViewLoading] = useState(false)
  const [quickViewProduct, setQuickViewProduct] = useState<HttpTypes.StoreProduct>(product)
  const cartSidebar = useOptionalCartSidebar()
  const openCart = cartSidebar?.openCart
  const { optimisticAdd } = useCartStore()
  const countryCodeParam = DEFAULT_COUNTRY_CODE
  const multipleVariants = (product.variants?.length ?? 0) > 1
  const defaultVariant = useMemo(() => {
    if (!product.variants?.length) {
      return null
    }

    const prioritized = product.variants.find((variant) => {
      if (!variant) return false
      if (variant.manage_inventory === false) return true
      if (variant.allow_backorder) return true
      return (variant.inventory_quantity ?? 0) > 0
    })

    return prioritized ?? product.variants[0]
  }, [product.variants])

  const cardClassName = clx(
    "group relative block overflow-hidden transition-all duration-300",
    {
      "flex flex-row gap-6": isListView,
    }
  )
  const imageWrapperClassName = clx(
    "relative w-full overflow-hidden rounded-2xl bg-ui-bg-subtle",
    {
      "w-48 shrink-0 aspect-square": isListView,
      "aspect-square": !isListView,
    }
  )
  const titleSizeMap: Record<ViewMode, string> = {
    "grid-4": "text-lg",
    "grid-5": "text-base",
    list: "text-2xl",
  }
  const titleClassName = clx(
    "font-semibold tracking-tight",
    isListView ? "line-clamp-2" : "line-clamp-1",
    titleSizeMap[viewMode] ?? "text-lg"
  )
  const descriptionPreview = isListView && product.description ? product.description : undefined
  const buttonLabel = multipleVariants ? "View options" : status === "added" ? "Added!" : status === "error" ? "Try again" : "Add to cart"
  const showMobileLoadingState = !multipleVariants && isPending

  const openQuickView = async (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsQuickViewLoading(true)
    try {
      const response = await fetch("/api/storefront/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countryCode: countryCodeParam,
          limit: 1,
          productsIds: [product.id],
        }),
      })

      if (response.ok) {
        const payload = (await response.json()) as { products?: HttpTypes.StoreProduct[] }
        const fetched = payload.products?.[0]
        if (fetched?.id) {
          setQuickViewProduct(fetched)
        } else {
          setQuickViewProduct(product)
        }
      } else {
        setQuickViewProduct(product)
      }
    } catch (error) {
      console.error("Failed to load quick view product", error)
      setQuickViewProduct(product)
    } finally {
      setIsQuickViewLoading(false)
      setIsQuickViewOpen(true)
    }
  }

  return (
    <>
      <LocalizedClientLink
        href={`/products/${product.handle}`}
        className={cardClassName}
      >
        <div
          className={clx("flex flex-col gap-4", {
            "flex w-full flex-row gap-6": isListView,
          })}
          data-testid="product-wrapper"
        >
        <div className={imageWrapperClassName}>
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            size="full"
            isFeatured={isFeatured}
            className="h-full w-full rounded-2xl border-none bg-ui-bg-base/0 p-0 shadow-none object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
          <div className="absolute right-3 top-3 translate-x-4 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
            <WishlistButton
              productId={product.id}
              productTitle={product.title}
            />
          </div>
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>
        <div className={clx("flex flex-1 flex-col gap-2")}>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Text className={titleClassName} data-testid="product-title">
                {product.title}
              </Text>
            </div>
            {descriptionPreview && (
              <SafeRichText
                html={descriptionPreview}
                className="text-sm text-ui-fg-muted line-clamp-4 rich-text-muted"
              />
            )}
          </div>
          <div className="mt-auto flex items-center justify-between gap-4">
            <div className="flex items-end justify-between gap-1">
              {cheapestPrice ? (
                <PreviewPrice price={cheapestPrice} />
              ) : (
                <span className="text-sm font-semibold text-ui-fg-base">
                  Pricing unavailable
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()

                if (multipleVariants || !defaultVariant?.id) {
                  void openQuickView(event)
                  return
                }

                startTransition(async () => {
                  setStatus("added")
                  openCart?.()
                  try {
                    await optimisticAdd({
                      product,
                      variant: defaultVariant,
                      quantity: 1,
                      countryCode: countryCodeParam,
                    })
                    setTimeout(() => setStatus("idle"), 2000)
                  } catch (error) {
                    console.error("Failed to add to cart", error)
                    setStatus("error")
                    setTimeout(() => setStatus("idle"), 2000)
                  }
                })
              }}
              className={clx(
                "inline-flex items-center justify-center text-xs font-semibold text-white transition gap-0 sm:gap-2",
                multipleVariants
                  ? "rounded-full h-11 w-11 px-0 py-0 sm:h-auto sm:w-auto sm:px-5 sm:py-2"
                  : "rounded-full h-11 w-11 px-0 py-0 sm:h-auto sm:w-auto sm:rounded-full sm:px-5 sm:py-2",
                multipleVariants
                  ? "bg-slate-900 hover:bg-slate-800"
                  : "bg-[#111827] hover:bg-black",
                {
                  "cursor-not-allowed opacity-60":
                    !multipleVariants && !defaultVariant?.id,
                }
              )}
              aria-label={buttonLabel}
              disabled={(isPending && !multipleVariants) || isQuickViewLoading}
            >
              {isQuickViewLoading || showMobileLoadingState ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <ShoppingCart className="h-4 w-4 sm:hidden" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">{buttonLabel}</span>
            </button>
          </div>
        </div>
      </div>
      </LocalizedClientLink>
      <ProductQuickViewModal
        product={quickViewProduct}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
      />
    </>
  )
}
