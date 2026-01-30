import { ViewMode } from "@modules/store/components/refinement-list/types"
import { getGridClassName, getGridItemClassName } from "./utils"

type ProductGridSkeletonProps = {
  viewMode?: ViewMode
  count?: number
}

const ProductGridSkeleton = ({ viewMode = "grid-4", count = 12 }: ProductGridSkeletonProps) => {
  const items = Array.from({ length: count }, (_, index) => index)
  const gridClassName = getGridClassName(viewMode)
  const itemClassName = getGridItemClassName(viewMode)
  const block = "animate-pulse bg-slate-200"

  if (viewMode === "list") {
    return (
      <div className={gridClassName} data-testid="products-list-skeleton" aria-label="Loading products">
        {items.map((item) => (
          <div
            key={`list-skeleton-${item}`}
            className="group flex w-full gap-6 rounded-2xl bg-white p-3"
          >
            {/* Image skeleton - matches rounded-2xl from actual card */}
            <div className="relative w-48 shrink-0 aspect-square">
              <div className={`${block} h-full w-full rounded-2xl`} />
              {/* Wishlist heart icon placeholder */}
              <div className="absolute right-3 top-3 h-10 w-10 rounded-full bg-white/20"></div>
            </div>

            <div className="flex flex-1 flex-col gap-3">
              {/* Product title */}
              <div className={`${block} h-6 w-3/4 rounded`} />

              {/* Description lines */}
              <div className="space-y-2">
                <div className={`${block} h-4 w-full rounded`} />
                <div className={`${block} h-4 w-5/6 rounded`} />
              </div>

              {/* Price section */}
              <div className="mt-auto space-y-2">
                <div className="flex items-center gap-2">
                  {/* Current price */}
                  <div className={`${block} h-6 w-20 rounded`} />
                  {/* Original price */}
                  <div className={`${block} h-5 w-20 rounded opacity-50`} />
                  {/* Discount badge */}
                  <div className={`${block} h-5 w-16 rounded-full`} />
                </div>
                {/* Club price */}
                <div className={`${block} h-5 w-32 rounded`} />
              </div>

              {/* Action button */}
              <div className={`${block} h-10 w-36 rounded-full mt-2`} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <ul className={gridClassName} data-testid="products-list-skeleton" aria-label="Loading products">
      {items.map((item) => (
        <li key={`grid-skeleton-${item}`} className={itemClassName}>
          <div className="group relative flex flex-col h-full">
            {/* Image container - matches exact styling from product card */}
            <div className="relative w-full aspect-square overflow-hidden rounded-2xl bg-gray-100">
              <div className={`${block} h-full w-full rounded-2xl`} />

              {/* Wishlist button placeholder (top right) - shows on hover */}
              <div className="absolute right-3 top-3 h-10 w-10 rounded-full bg-white/30 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block"></div>

              {/* Hover overlay placeholder */}
              <div className="absolute inset-0 rounded-2xl bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

              {/* Hover action button placeholder (bottom) */}
              <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                <div className={`${block} h-12 w-full rounded-full bg-white/80`} />
              </div>
            </div>

            {/* Product details - matches actual card spacing */}
            <div className="flex flex-col gap-1 mt-3 flex-1">
              {/* Product title */}
              <div className={`${block} h-5 w-4/5 rounded`} />

              {/* Price section - matches actual layout with current price, original price, discount */}
              <div className="mt-auto space-y-1.5 pt-2">
                {/* Current price and original price row */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Current price (red color in actual) */}
                  <div className={`${block} h-6 w-20 rounded`} />
                  {/* Original price (strikethrough) */}
                  <div className={`${block} h-5 w-20 rounded opacity-50`} />
                  {/* Discount badge [30% OFF] */}
                  <div className={`${block} h-5 w-16 rounded-full`} />
                </div>

                {/* Club price (green in actual) */}
                <div className={`${block} h-5 w-32 rounded`} />
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

export default ProductGridSkeleton
