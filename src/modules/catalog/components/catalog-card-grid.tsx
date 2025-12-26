import CatalogCard from "@modules/catalog/components/catalog-card"
import type { CatalogCardItem, CatalogViewMode } from "@modules/catalog/types"

type CatalogCardGridProps = {
  items: CatalogCardItem[]
  viewMode?: CatalogViewMode
}

const CatalogCardGrid = ({ items, viewMode = "grid-4" }: CatalogCardGridProps) => {
  if (!items.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 px-6 py-16 text-center text-slate-500">
        Nothing to show just yet. Try adding categories or collections in the Medusa Admin.
      </div>
    )
  }

  const gridClass = viewMode === "grid-5"
    ? "grid grid-cols-1 gap-6 small:grid-cols-2 xl:grid-cols-5"
    : "grid grid-cols-1 gap-6 small:grid-cols-2 xl:grid-cols-4"

  return (
    <div className={gridClass}>
      {items.map((item) => (
        <CatalogCard key={item.id} item={item} viewMode={viewMode} />
      ))}
    </div>
  )
}

export default CatalogCardGrid
