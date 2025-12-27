import { Text, clx } from "@medusajs/ui"

export default function PreviewPrice({ price }: { price: any | null }) {
  if (!price) {
    return null
  }

  return (
    <div className="flex flex-col leading-tight">
      <Text
        className={clx("text-lg font-semibold", {
          "text-[#E7353A]": price.is_discounted,
          "text-ui-fg-base": !price.is_discounted,
        })}
        data-testid="price"
      >
        {price.calculated_price}
      </Text>
      {price.original_price && (
        <Text
          className="text-sm text-ui-fg-muted line-through"
          data-testid="original-price"
        >
          {price.original_price}
        </Text>
      )}
    </div>
  )
}
