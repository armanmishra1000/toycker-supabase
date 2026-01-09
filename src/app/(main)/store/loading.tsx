import ProductGridSkeleton from "@modules/store/components/product-grid-section/product-grid-skeleton"

export default function Loading() {
    return (
        <div className="content-container py-6">
            <div className="flex flex-col gap-8">
                {/* Breadcrumbs skeleton */}
                <div className="flex items-center gap-2">
                    <div className="animate-pulse bg-slate-200 rounded w-12 h-4" />
                    <div className="text-slate-200">/</div>
                    <div className="animate-pulse bg-slate-200 rounded-full w-16 h-4" />
                </div>

                {/* Page title skeleton - "All products" */}
                <div className="animate-pulse bg-slate-200 rounded-full w-48 h-10" />

                {/* Filters and view options row skeleton */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
                    {/* Left side - Filters button and results count */}
                    <div className="flex items-center gap-4">
                        {/* Filters button skeleton */}
                        <div className="animate-pulse bg-slate-200 rounded-full w-20 h-8" />
                        {/* Results count text skeleton */}
                        <div className="animate-pulse bg-slate-200 rounded-md w-48 h-5" />
                    </div>

                    {/* Right side - View mode and sort */}
                    <div className="flex items-center gap-3">
                        {/* View mode buttons skeleton */}
                        <div className="flex items-center gap-2">
                            <div className="animate-pulse bg-slate-200 rounded-full w-24 h-8" />
                            <div className="animate-pulse bg-slate-200 rounded-full w-24 h-8" />
                            <div className="animate-pulse bg-slate-200 rounded-full w-16 h-8" />
                        </div>

                        {/* Sort dropdown skeleton */}
                        <div className="animate-pulse bg-slate-200 rounded-full w-32 h-8" />
                    </div>
                </div>

                {/* Product grid skeleton */}
                <ProductGridSkeleton count={12} />
            </div>
        </div>
    )
}
