import { Suspense } from "react"

export default function ProductLoading() {
    return (
        <div className="content-container py-6 lg:py-10">
            {/* Breadcrumbs skeleton */}
            <div className="mb-6 h-4 w-48 bg-gray-200 rounded animate-pulse" />

            <div className="flex flex-col gap-10 xl:flex-row xl:items-start">
                {/* Image Gallery Skeleton (Left Column) */}
                <div className="w-full xl:w-3/5">
                    <div className="flex flex-col gap-4">
                        {/* Main Image */}
                        <div className="w-full aspect-[4/5] bg-gray-200 rounded-lg animate-pulse" />
                        {/* Thumbnails */}
                        <div className="grid grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Product Details Skeleton (Right Column) */}
                <div className="w-full xl:w-2/5 flex flex-col gap-6">
                    {/* Title */}
                    <div className="space-y-2">
                        <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse" />
                        <div className="h-8 w-1/2 bg-gray-200 rounded animate-pulse" />
                    </div>

                    {/* Price */}
                    <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />

                    {/* Description Short */}
                    <div className="space-y-2">
                        <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
                    </div>

                    {/* Options / Variants */}
                    <div className="space-y-4">
                        <div className="h-12 w-full bg-gray-200 rounded animate-pulse" />
                        <div className="h-12 w-full bg-gray-200 rounded animate-pulse" />
                    </div>

                    {/* Add to Cart Button */}
                    <div className="h-12 w-full bg-gray-200 rounded-full animate-pulse mt-4" />

                    {/* Extra Info */}
                    <div className="grid grid-cols-3 gap-4 mt-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex flex-col items-center gap-2">
                                <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
                                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tabs & Reviews Skeleton */}
            <div className="mt-16 space-y-10">
                {/* Tabs */}
                <div>
                    <div className="flex border-b border-gray-200 mb-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="px-6 py-4">
                                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                    <div className="space-y-4">
                        <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-4/5 bg-gray-200 rounded animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    )
}
