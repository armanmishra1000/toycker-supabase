import ProductGridSkeleton from "@modules/store/components/product-grid-section/product-grid-skeleton"

export default function CategoryPageLoading() {
  return (
    <div className="mx-auto max-w-[1440px] p-4 pb-10">
      <div className="mb-6 h-5 w-24 animate-pulse rounded-full bg-slate-200" aria-hidden />
      <div className="mb-4 h-9 w-48 animate-pulse rounded-full bg-slate-200" aria-hidden />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
        {[...Array(4)].map((_, index) => (
          <span
            key={index}
            className="h-9 w-24 animate-pulse rounded-full bg-slate-200"
            aria-hidden
          />
        ))}
      </div>
      <ProductGridSkeleton />
    </div>
  )
}
