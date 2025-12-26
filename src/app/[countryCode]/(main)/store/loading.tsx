import ProductGridSkeleton from "@modules/store/components/product-grid-section/product-grid-skeleton"

export default function StoreLoading() {
  return (
    <div className="mx-auto max-w-[1440px] p-4 pb-10" aria-busy="true" aria-live="polite">
      <div className="mb-6 h-5 w-32 animate-pulse rounded-full bg-slate-200" aria-hidden />
      <div className="mb-4 h-9 w-64 animate-pulse rounded-full bg-slate-200" aria-hidden />

      <div className="mb-6 flex flex-wrap gap-3">
        {[...Array(5)].map((_, index) => (
          <span
            key={`filter-chip-${index}`}
            className="h-9 w-24 animate-pulse rounded-full bg-slate-200"
            aria-hidden
          />
        ))}
      </div>

      <ProductGridSkeleton viewMode="grid-4" count={12} />
    </div>
  )
}
