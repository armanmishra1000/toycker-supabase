import { Text } from "@modules/common/components/text"
import { cn } from "@lib/util/cn"
import { Star } from "lucide-react"

export default function PreviewPrice({ price }: { price: any | null }) {
  if (!price) {
    return null
  }

  return (
    <div className="flex flex-col leading-tight w-full">
      <div className="flex items-center w-full gap-2">
        <div className="flex items-center gap-2">
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
              className="text-gray-400 font-normal line-through whitespace-nowrap"
              data-testid="original-price"
            >
              {price.original_price}
            </Text>
          )}
        </div>
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