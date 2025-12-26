import CatalogCardGridSkeleton from "@modules/catalog/components/catalog-card-grid-skeleton"

export default function CategoriesLoading() {
  return (
    <div className="mx-auto max-w-[1440px] space-y-6 pb-8 pt-4">
      <div className="h-4 w-32 animate-pulse rounded-full bg-slate-100" aria-hidden />
      <div className="flex flex-col gap-2">
        <div className="h-10 w-72 animate-pulse rounded-full bg-slate-200" aria-hidden />
        <div className="h-5 w-96 animate-pulse rounded-full bg-slate-100" aria-hidden />
      </div>
      <CatalogCardGridSkeleton />
    </div>
  )
}
