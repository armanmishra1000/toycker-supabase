import { Text, clx } from "@medusajs/ui"
import { VariantPrice } from "types/global"
import { buildDisplayPrice } from "@lib/util/display-price"

export default function PreviewPrice({ price }: { price: VariantPrice | null }) {
  const displayPrice = buildDisplayPrice(price)

  if (!displayPrice) {
    return null
  }

  return (
    <div className="flex flex-col leading-tight">
      <Text
        className={clx("text-lg font-semibold", {
          "text-[#E7353A]": displayPrice.isDiscounted,
          "text-ui-fg-base": !displayPrice.isDiscounted,
        })}
        data-testid="price"
      >
        {displayPrice.current.raw}
      </Text>
      {displayPrice.original && (
        <Text
          className="text-sm text-ui-fg-muted line-through"
          data-testid="original-price"
        >
          {displayPrice.original.raw}
        </Text>
      )}
    </div>
  )
}
