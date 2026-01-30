import CatalogGridSkeleton from "@modules/common/components/skeletons/catalog-grid-skeleton"

export default function Loading() {
    return (
        <div className="mx-auto p-4 max-w-[1440px] pb-10 w-full">
            <div className="flex flex-col gap-8">
                {/* Breadcrumbs skeleton */}
                <div className="flex items-center gap-2 mb-6 hidden small:block">
                    <div className="flex items-center gap-2">
                        <div className="animate-pulse bg-slate-200 rounded w-12 h-4" />
                        <div className="text-slate-200">/</div>
                        <div className="animate-pulse bg-slate-200 rounded-full w-20 h-4" />
                    </div>
                </div>

                {/* Page title and description skeleton */}
                <div className="mb-10">
                    <div className="animate-pulse bg-slate-200 rounded-full w-64 h-10 mb-4" />
                    <div className="animate-pulse bg-slate-200 rounded-md w-full max-w-xl h-6" />
                </div>

                {/* Catalog grid skeleton */}
                <section className="space-y-6">
                    <CatalogGridSkeleton count={12} />
                </section>
            </div>
        </div>
    )
}
