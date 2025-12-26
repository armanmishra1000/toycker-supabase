import { clx } from "@medusajs/ui"

import { getProductPrice } from "@lib/util/get-product-price"
import { buildDisplayPrice } from "@lib/util/display-price"
import { HttpTypes } from "@medusajs/types"

export default function ProductPrice({
  product,
  variant,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
}) {
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
  })

  const selectedPrice = variant ? variantPrice : cheapestPrice
  const displayPrice = buildDisplayPrice(selectedPrice)

  if (!displayPrice) {
    return <div className="block w-32 h-9 bg-gray-100 animate-pulse" />
  }

  return (
    <div className="flex flex-col text-ui-fg-base">
      <span
        className={clx("text-xl-semi", {
          "text-[#E7353A]": displayPrice.isDiscounted,
          "text-ui-fg-base": !displayPrice.isDiscounted,
        })}
      >
        {!variant && "From "}
        <span
          data-testid="product-price"
          data-value={displayPrice.current.value}
        >
          {displayPrice.current.raw}
        </span>
      </span>
      {displayPrice.original && (
        <div className="flex items-baseline gap-2">
          <span
            className="text-ui-fg-muted line-through"
            data-testid="original-product-price"
            data-value={displayPrice.original.value}
          >
            {displayPrice.original.raw}
          </span>
          {displayPrice.percentageText && (
            <span className="text-ui-fg-interactive text-sm font-semibold">
              {displayPrice.percentageText}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
