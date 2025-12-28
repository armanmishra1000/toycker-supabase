import { cn } from "@lib/util/cn"
import { Product } from "@/lib/supabase/types"
import { getProductPrice } from "@lib/util/get-product-price"
import { Info } from "lucide-react"
import Link from "next/link"

export default function ProductPrice({
  product,
  variant,
  clubDiscountPercentage = 0,
}: {
  product: Product
  variant?: any
  clubDiscountPercentage?: number
}) {
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
    clubDiscountPercentage,
  })

  // Use variant price if selected, otherwise formatted price (cheapest)
  const selectedPrice = variantPrice || cheapestPrice
  if (!selectedPrice) return null

  return (
    <div className="flex flex-col text-gray-900">
      <div className="flex items-baseline gap-3">
        <span
          className={cn("text-2xl font-bold tracking-tight", {
            "text-[#E7353A]": selectedPrice.is_discounted,
            "text-gray-900": !selectedPrice.is_discounted,
          })}
        >
          <span data-testid="product-price">
            {selectedPrice.calculated_price}
          </span>
        </span>
        {selectedPrice.original_price && selectedPrice.original_price !== selectedPrice.calculated_price && (
          <span
            className="text-lg text-gray-500 line-through decoration-1"
            data-testid="original-product-price"
          >
            {selectedPrice.original_price}
          </span>
        )}
      </div>

      {selectedPrice.club_price && (
        <div className="flex items-center gap-2 mt-2 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg w-fit border border-emerald-100">
          <span className="font-semibold text-sm">Club Price: {selectedPrice.club_price}</span>
          <Link href="/club" className="text-emerald-500 hover:text-emerald-700 transition-colors" title="Learn about Club prices">
            <Info className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  )
}
