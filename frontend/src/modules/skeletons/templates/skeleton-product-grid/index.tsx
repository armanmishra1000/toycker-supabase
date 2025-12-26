import repeat from "@lib/util/repeat"
import SkeletonProductPreview from "@modules/skeletons/components/skeleton-product-preview"
import { ViewMode } from "@modules/store/components/refinement-list/types"

type SkeletonProductGridProps = {
  numberOfProducts?: number
  viewMode?: ViewMode
}

const SkeletonProductGrid = ({ numberOfProducts = 8, viewMode = "grid-4" }: SkeletonProductGridProps) => {
  const isListView = viewMode === "list"
  const gridClassName = getGridClassName(viewMode)

  if (isListView) {
    return (
      <div className={gridClassName} data-testid="products-list-loader">
        {repeat(numberOfProducts).map((index) => (
          <SkeletonProductPreview key={index} viewMode="list" />
        ))}
      </div>
    )
  }

  return (
    <ul className={gridClassName} data-testid="products-list-loader">
      {repeat(numberOfProducts).map((index) => (
        <li key={index}>
          <SkeletonProductPreview viewMode={viewMode} />
        </li>
      ))}
    </ul>
  )
}

const getGridClassName = (viewMode: ViewMode) => {
  if (viewMode === "grid-5") {
    return "grid grid-cols-2 small:grid-cols-3 medium:grid-cols-5 gap-x-6 gap-y-8 flex-1"
  }

  if (viewMode === "grid-4") {
    return "grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8 flex-1"
  }

  if (viewMode === "list") {
    return "flex w-full flex-col gap-5 flex-1"
  }

  return "grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8 flex-1"
}

export default SkeletonProductGrid
