import { cn } from "@lib/util/cn"
import { Product } from "@/lib/supabase/types"

export default function ProductPrice({
  product,
  variant,
}: {
  product: Product
  variant?: any
}) {
  const price = product.price
  const compareAtPrice = product.metadata?.compare_at_price as number | undefined
  const isDiscounted = !!compareAtPrice && compareAtPrice > price

  return (
    <div className="flex flex-col text-gray-900">
      <span
        className={cn("text-xl font-semibold", {
          "text-[#E7353A]": isDiscounted,
          "text-gray-900": !isDiscounted,
        })}
      >
        <span
          data-testid="product-price"
        >
          ₹{price}
        </span>
      </span>
      {compareAtPrice && (
        <div className="flex items-baseline gap-2">
          <span
            className="text-gray-500 line-through"
            data-testid="original-product-price"
          >
            ₹{compareAtPrice}
          </span>
        </div>
      )}
    </div>
  )
}
