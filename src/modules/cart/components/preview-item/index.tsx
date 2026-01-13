"use client"

import { Text } from "@modules/common/components/text"
import { CartItem } from "@/lib/supabase/types"
import { getImageUrl } from "@lib/util/get-image-url"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemOptions from "@modules/common/components/line-item-options"
import Thumbnail from "@modules/products/components/thumbnail"
import Image from "next/image"
import { isGiftWrapLine } from "@modules/cart/utils/gift-wrap"

type PreviewItemProps = {
  item: CartItem
  currencyCode: string
}

const PreviewItem = ({ item, currencyCode }: PreviewItemProps) => {
  const giftWrapLine = isGiftWrapLine(item.metadata)
  const displayTitle = giftWrapLine ? "Gift Wrap" : item.product_title

  const renderThumbnail = () => {
    if (giftWrapLine) {
      return (
        <div className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 rounded-xl overflow-hidden shadow-sm">
          <div className="w-full h-full flex items-center justify-center bg-slate-50 border border-slate-200">
            <Image
              src="/assets/images/gift-wrap.png"
              alt="Gift wrap"
              width={200}
              height={200}
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )
    }

    return (
      <div className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 rounded-xl overflow-hidden shadow-sm">
        <Thumbnail
          thumbnail={item.thumbnail}
          images={item.variant?.product?.images ? item.variant.product.images.map(img => ({ url: getImageUrl(img) || '' })) : []}
          size="square"
        />
      </div>
    )
  }

  return (
    <div className="flex gap-3 sm:gap-4 w-full py-3 sm:py-4 border-b border-slate-100 last:border-0" data-testid="product-row">
      {/* Thumbnail */}
      <div className="flex-shrink-0">
        {renderThumbnail()}
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        {/* Product Title */}
        <Text
          weight="semibold"
          className="text-sm sm:text-base text-slate-900 break-words leading-snug"
          data-testid="product-title"
        >
          {displayTitle}
        </Text>

        {/* Variant (if not gift wrap) */}
        {!giftWrapLine && item.variant && (
          <div className="mt-0.5">
            <LineItemOptions variant={item.variant} data-testid="product-variant" />
          </div>
        )}

        {/* Quantity */}
        <div className="mt-1.5 flex items-center gap-1">
          <Text className="text-xs sm:text-sm text-slate-500">
            Qty: {item.quantity}
          </Text>
        </div>
      </div>

      {/* Price */}
      <div className="flex-shrink-0 flex items-center">
        <LineItemPrice
          item={item}
          style="tight"
          currencyCode={currencyCode}
        />
      </div>
    </div>
  )
}

export default PreviewItem
