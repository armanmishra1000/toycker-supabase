import { Text } from "@modules/common/components/text"
import { cn } from "@lib/util/cn"

export default function PreviewPrice({ price }: { price: any | null }) {
  if (!price) {
    return null
  }

  return (
    <div className="flex flex-col leading-tight w-full gap-1">
      <div className="flex flex-wrap items-center w-full gap-x-2 gap-y-0.5">
        <Text
          className={cn("text-lg font-bold text-slate-900", {
            "text-[#E7353A]": price.is_discounted,
          })}
          data-testid="price"
        >
          {price.calculated_price}
        </Text>
        {price.original_price && price.is_discounted && (
          <Text
            className="text-xs text-gray-400 font-normal line-through whitespace-nowrap"
            data-testid="original-price"
          >
            {price.original_price}
          </Text>
        )}
        {price.is_discounted && (
          <Text className="text-sm font-bold text-emerald-600 uppercase tracking-tight">
            [{price.percentage_diff}% OFF]
          </Text>
        )}
      </div>
      {price.club_price && (
        <Text
          className="text-emerald-700 font-bold whitespace-nowrap"
          data-testid="club-price"
        >
          Club Price: {price.club_price}
        </Text>
      )}
    </div>
  )
}