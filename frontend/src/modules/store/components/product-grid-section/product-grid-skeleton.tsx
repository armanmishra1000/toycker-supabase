import { ViewMode } from "@modules/store/components/refinement-list/types"
import { getGridClassName } from "./utils"

type ProductGridSkeletonProps = {
  viewMode?: ViewMode
  count?: number
}

const ProductGridSkeleton = ({ viewMode = "grid-4", count = 12 }: ProductGridSkeletonProps) => {
  const items = Array.from({ length: count }, (_, index) => index)
  const gridClassName = getGridClassName(viewMode)
  const block = "animate-pulse bg-slate-200"

  if (viewMode === "list") {
    return (
      <div className={gridClassName} data-testid="products-list-skeleton" aria-label="Loading products">
        {items.map((item) => (
          <div
            key={`list-skeleton-${item}`}
            className="group flex w-full gap-6 rounded-2xl bg-ui-bg-base/90"
          >
            <div className={`${block} h-44 w-44 flex-shrink-0 rounded-2xl`} />
            <div className="flex flex-1 flex-col gap-4">
              <div className="space-y-3">
                <div className={`${block} h-6 w-2/3 rounded-full`} />
                <div className={`${block} h-4 w-1/3 rounded-full`} />
                <div className="space-y-2">
                  <div className={`${block} h-4 w-full rounded-full`} />
                  <div className={`${block} h-4 w-5/6 rounded-full`} />
                </div>
              </div>
              <div className="mt-auto flex flex-wrap items-center gap-3">
                <div className={`${block} h-6 w-24 rounded-full`} />
                <div className={`${block} h-10 w-36 rounded-full`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <ul className={gridClassName} data-testid="products-list-skeleton" aria-label="Loading products">
      {items.map((item) => (
        <li key={`grid-skeleton-${item}`}>
          <div className="group relative flex flex-col gap-4 rounded-2xl bg-ui-bg-base/90">
            <div className={`${block} aspect-square w-full rounded-2xl`} />
            <div className="flex flex-col gap-3">
              <div className={`${block} h-5 w-3/4 rounded-full`} />
              <div className={`${block} h-4 w-1/2 rounded-full`} />
              <div className="flex items-center justify-between gap-3">
                <div className={`${block} h-5 w-20 rounded-full`} />
                <div className={`${block} h-10 md:w-28 w-10 rounded-full`} />
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

export default ProductGridSkeleton
