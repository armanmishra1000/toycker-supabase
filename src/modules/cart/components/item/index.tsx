"use client"

import { Text } from "@modules/common/components/text"
import { cn } from "@lib/util/cn"
import { CartItem } from "@/lib/supabase/types"
import { getImageUrl } from "@lib/util/get-image-url"
import QuantitySelector from "@modules/common/components/quantity-selector"
import ErrorMessage from "@modules/checkout/components/error-message"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import Image from "next/image"
import { isGiftWrapLine } from "@modules/cart/utils/gift-wrap"
import { useState } from "react"
import { useCartStore } from "@modules/cart/context/cart-store-context"

type ItemProps = {
  item: CartItem
  type?: "full" | "preview"
  currencyCode: string
}

const Item = ({ item, type = "full", currencyCode }: ItemProps) => {
  const { optimisticUpdateQuantity, isUpdating, isRemoving } = useCartStore()
  const [error, setError] = useState<string | null>(null)

  const giftWrapLine = isGiftWrapLine(item.metadata)
  const displayTitle = giftWrapLine ? "Gift Wrap" : item.product_title
  const canNavigate = Boolean(item.product_handle && !giftWrapLine)

  const handleQuantityChange = async (newQuantity: number) => {
    try {
      await optimisticUpdateQuantity(item.id, newQuantity)
    } catch (err: any) {
      setError(err.message || "Failed to update quantity")
    }
  }

  // TODO: Update this to grab the actual max inventory
  const maxQtyFromInventory = 10
  const maxQuantity = giftWrapLine
    ? 10
    : item.variant?.manage_inventory
      ? item.variant.inventory_quantity ?? 10
      : maxQtyFromInventory

  const thumbnailWrapperClass = cn("flex flex-shrink-0 rounded-xl overflow-hidden shadow-sm", {
    "w-14 h-14 sm:w-16 sm:h-16": type === "preview",
    "w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24": type === "full",
  })

  const renderThumbnail = () => {
    if (giftWrapLine) {
      return (
        <div className={thumbnailWrapperClass}>
          <div className="w-full h-full items-center justify-center bg-slate-50 border border-slate-200">
            <Image
              src="/assets/images/gift-wrap.png"
              alt="Gift wrap"
              width={200}
              height={200}
              className="w-full h-full object-contain p-2"
            />
          </div>
        </div>
      )
    }

    const thumb = (
      <Thumbnail
        thumbnail={item.thumbnail}
        images={item.variant?.product?.images ? item.variant.product.images.map(img => ({ url: getImageUrl(img) || '' })) : []}
        size="square"
      />
    )

    if (!canNavigate) {
      return <div className={thumbnailWrapperClass}>{thumb}</div>
    }

    return (
      <LocalizedClientLink
        href={`/products/${item.product_handle}`}
        className={thumbnailWrapperClass}
      >
        {thumb}
      </LocalizedClientLink>
    )
  }

  return (
    <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_auto] lg:grid-cols-[auto_1fr_100px_120px_100px] gap-x-4 gap-y-3 w-full py-5 sm:py-6 border-b border-slate-100 last:border-0" data-testid="product-row">
      {/* Thumbnail Column */}
      <div className="!pl-0 !pr-0">
        {renderThumbnail()}
      </div>

      {/* Product Info Column */}
      <div className="flex flex-col justify-center min-w-0 pr-2">
        {canNavigate ? (
          <LocalizedClientLink
            href={`/products/${item.product_handle}`}
            className="inline-block"
          >
            <Text
              weight="semibold"
              className="text-sm sm:text-base text-slate-900 hover:text-slate-700 hover:underline break-words leading-tight transition-colors"
              data-testid="product-title"
            >
              {displayTitle}
            </Text>
          </LocalizedClientLink>
        ) : (
          <Text
            weight="semibold"
            className="text-sm sm:text-base text-slate-900 break-words leading-tight"
            data-testid="product-title"
          >
            {displayTitle}
          </Text>
        )}

        {!giftWrapLine && (
          <div className="mt-1">
            <LineItemOptions variant={item.variant} data-testid="product-variant" />
          </div>
        )}

        {/* Desktop: Remove button below title */}
        {type === "full" && (
          <div className="hidden lg:block mt-3">
            <DeleteButton id={item.id} data-testid="product-delete-button" />
          </div>
        )}

        {/* Mobile-only: Quantity and Remove buttons below title */}
        {type === "full" && (
          <div className="flex md:hidden items-center gap-2 mt-3">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs text-slate-500">Qty:</span>
              <QuantitySelector
                quantity={item.quantity}
                onChange={handleQuantityChange}
                max={maxQuantity}
                loading={isUpdating(item.id)}
                disabled={isRemoving(item.id)}
                size="small"
                data-testid="product-select-button"
              />
            </div>
            <div className="flex-shrink-0 ml-auto">
              <DeleteButton id={item.id} data-testid="product-delete-button" />
            </div>
          </div>
        )}
      </div>

      {/* Quantity Column - Desktop only */}
      {type === "full" && (
        <div className="hidden lg:flex items-center justify-center">
          <QuantitySelector
            quantity={item.quantity}
            onChange={handleQuantityChange}
            max={maxQuantity}
            loading={isUpdating(item.id)}
            disabled={isRemoving(item.id)}
            data-testid="product-select-button"
          />
        </div>
      )}

      {/* Unit Price Column - Desktop only */}
      {type === "full" && (
        <div className="hidden lg:flex items-center justify-end">
          <LineItemUnitPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
          />
        </div>
      )}

      {/* Total Price Column - All views */}
      <div className="flex items-center justify-end min-w-[90px]">
        <LineItemPrice
          item={item}
          style="tight"
          currencyCode={currencyCode}
        />
      </div>

      {error && <div className="col-span-full lg:col-span-5 mt-2"><ErrorMessage error={error} data-testid="product-error-message" /></div>}
    </div>
  )
}

export default Item