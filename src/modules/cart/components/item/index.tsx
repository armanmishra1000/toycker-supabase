"use client"

import { Text } from "@modules/common/components/text"
import { cn } from "@lib/util/cn"
import { updateLineItem } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import CartItemSelect from "@modules/cart/components/cart-item-select"
import ErrorMessage from "@modules/checkout/components/error-message"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Spinner from "@modules/common/icons/spinner"
import Thumbnail from "@modules/products/components/thumbnail"
import Image from "next/image"
import { isGiftWrapLine } from "@modules/cart/utils/gift-wrap"
import { useState } from "react"

type ItemProps = {
  item: any
  type?: "full" | "preview"
  currencyCode: string
}

const Item = ({ item, type = "full", currencyCode }: ItemProps) => {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const giftWrapLine = isGiftWrapLine(item.metadata)
  const displayTitle = giftWrapLine ? "Gift Wrap" : item.product_title
  const canNavigate = Boolean(item.product_handle && !giftWrapLine)

  const changeQuantity = async (quantity: number) => {
    setError(null)
    setUpdating(true)

    await updateLineItem({
      lineId: item.id,
      quantity,
    })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setUpdating(false)
      })
  }

  // TODO: Update this to grab the actual max inventory
  const maxQtyFromInventory = 10
  const maxQuantity = giftWrapLine
    ? 10
    : item.variant?.manage_inventory
    ? 10
    : maxQtyFromInventory

  const thumbnailWrapperClass = cn("flex", {
    "w-16": type === "preview",
    "small:w-24 w-12": type === "full",
  })

  const renderThumbnail = () => {
    if (giftWrapLine) {
      return (
        <div
          className={`${thumbnailWrapperClass} items-center justify-center rounded-xl bg-slate-50 border border-slate-200  p-4`}
        >
          <Image
            src="/assets/images/gift-wrap.png"
            alt="Gift wrap"
            width={200}
            height={200}
            className="h-16 w-16 object-contain"
          />
        </div>
      )
    }

    const thumb = (
      <Thumbnail
        thumbnail={item.thumbnail}
        images={item.variant?.product?.images}
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
    <div className="grid grid-cols-[auto_1fr_auto] gap-4 w-full py-4 border-b border-gray-100 last:border-0" data-testid="product-row">
      <div className="!pl-0 w-24">{renderThumbnail()}</div>

      <div className="text-left flex flex-col justify-center">
        {canNavigate ? (
          <LocalizedClientLink
            href={`/products/${item.product_handle}`}
            className="inline-block"
          >
            <Text
              weight="semibold"
              className="text-sm text-gray-900 hover:underline"
              data-testid="product-title"
            >
              {displayTitle}
            </Text>
          </LocalizedClientLink>
        ) : (
          <Text
            weight="semibold"
            className="text-sm text-gray-900"
            data-testid="product-title"
          >
            {displayTitle}
          </Text>
        )}
        {!giftWrapLine && (
          <LineItemOptions variant={item.variant} data-testid="product-variant" />
        )}
      </div>

      <div className="flex items-center gap-4">
        {type === "full" && (
          <div className="flex gap-2 items-center w-28">
            <DeleteButton id={item.id} data-testid="product-delete-button" />
            <CartItemSelect
              value={item.quantity}
              onChange={(value: any) => changeQuantity(parseInt(value.target.value))}
              className="w-14 h-10 p-2 text-sm border border-gray-200 rounded"
              data-testid="product-select-button"
            >
              {/* TODO: Update this with the v2 way of managing inventory */}
              {Array.from({ length: Math.min(maxQuantity, 10) }, (_, i) => (
                <option value={i + 1} key={i + 1}>
                  {i + 1}
                </option>
              ))}
            </CartItemSelect>
            {updating && <Spinner />}
          </div>
        )}

        {type === "full" && (
          <div className="hidden small:block min-w-[80px]">
            <LineItemUnitPrice
              item={item}
              style="tight"
              currencyCode={currencyCode}
            />
          </div>
        )}

        <div className="min-w-[80px] text-right flex flex-col items-end justify-center">
          <span
            className={cn({
              "flex flex-col items-end h-full justify-center": type === "preview",
            })}
          >
            {type === "preview" && (
              <span className="flex gap-x-1 ">
                <Text className="text-gray-500 text-xs">{item.quantity}x </Text>
                <LineItemUnitPrice
                  item={item}
                  style="tight"
                  currencyCode={currencyCode}
                />
              </span>
            )}
            <LineItemPrice
              item={item}
              style="tight"
              currencyCode={currencyCode}
            />
          </span>
        </div>
      </div>
      {error && <ErrorMessage error={error} data-testid="product-error-message" className="col-span-3" />}
    </div>
  )
}

export default Item
