const CatalogCardGridSkeleton = ({ count = 8 }: { count?: number }) => {
  const items = Array.from({ length: count }, (_, index) => index)

  return (
    <div className="grid grid-cols-1 gap-6 small:grid-cols-2 xl:grid-cols-4" aria-label="Loading catalog items">
      {items.map((item) => (
        <div
          key={`catalog-skeleton-${item}`}
          className="flex h-full flex-col overflow-hidden rounded-[32px] bg-white/80 p-4 shadow-sm ring-1 ring-black/5"
        >
          <div className="mb-4 aspect-[5/4] w-full animate-pulse rounded-2xl bg-slate-100" />
          <div className="flex flex-1 flex-col gap-3">
            <div className="h-4 w-20 animate-pulse rounded-full bg-slate-100" />
            <div className="h-6 w-3/4 animate-pulse rounded-full bg-slate-100" />
            <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
            <div className="mt-auto flex items-center justify-end">
              <span className="h-11 w-11 animate-pulse rounded-full bg-slate-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default CatalogCardGridSkeleton
