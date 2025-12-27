import { Text } from "@modules/common/components/text"
import { cn } from "@lib/util/cn"

export default function PreviewPrice({ price }: { price: any | null }) {
  if (!price) {
    return null
  }

  return (
    <div className="flex flex-col leading-tight">
      <Text
        className={cn("text-lg font-semibold", {
          "text-[#E7353A]": price.is_discounted,
          "text-gray-900": !price.is_discounted,
        })}
        data-testid="price"
      >
        {price.calculated_price}
      </Text>
      {price.original_price && (
        <Text
          className="text-sm text-gray-500 line-through"
          data-testid="original-price"
        >
          {price.original_price}
        </Text>
      )}
    </div>
  )
}