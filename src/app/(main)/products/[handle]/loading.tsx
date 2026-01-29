import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"

export default function Loading() {
    const block = "animate-pulse bg-slate-200"

    return (
        <>
            <div className="content-container py-6 lg:py-10">
                {/* Breadcrumbs skeleton */}
                <div className="flex items-center gap-2 mb-6 hidden small:flex">
                    <div className={`${block} w-12 h-4 rounded`} />
                    <div className="text-slate-200">/</div>
                    <div className={`${block} w-32 h-4 rounded`} />
                </div>

                {/* Two-column layout - Matches ProductTemplate */}
                <div className="flex flex-col gap-10 xl:flex-row xl:items-start">
                    {/* Left side - Image gallery skeleton */}
                    <div className="w-full xl:w-3/5 xl:sticky xl:top-[120px] self-start">
                        <div className="flex gap-4">
                            {/* Thumbnail strip (Desktop) */}
                            <div className="hidden md:flex flex-col gap-4 w-24 shrink-0">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className={`${block} aspect-[5/6] rounded-lg w-full`} />
                                ))}
                            </div>

                            {/* Main image */}
                            <div className={`${block} flex-1 aspect-[4/5] md:aspect-square rounded-2xl w-full`} />
                        </div>
                    </div>

                    {/* Right side - Product details skeleton */}
                    <div className="w-full xl:w-2/5 flex flex-col gap-y-8">
                        <div>
                            {/* Title */}
                            <div className={`${block} h-10 w-3/4 rounded-lg mb-2`} />
                            {/* Short Description Lines */}
                            <div className={`${block} h-4 w-full rounded mt-3`} />
                            <div className={`${block} h-4 w-5/6 rounded mt-2`} />
                        </div>

                        {/* Price Row */}
                        <div className="flex items-center gap-3">
                            <div className={`${block} h-8 w-24 rounded`} />
                            <div className={`${block} h-6 w-20 rounded opacity-50`} />
                            <div className={`${block} h-6 w-16 rounded-full`} />
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-100" />

                        {/* Options (Color/Size) */}
                        <div className="flex flex-col gap-y-4">
                            <div className="flex flex-col gap-y-2">
                                <div className={`${block} h-4 w-12 rounded`} />
                                <div className="flex gap-2">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className={`${block} h-10 w-10 rounded-full`} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Add to Cart Button */}
                        <div className="flex flex-col gap-y-3 mt-2">
                            <div className={`${block} h-12 w-full rounded-full`} />
                        </div>

                        {/* Extra Info Accordions */}
                        <div className="flex flex-col gap-y-3 mt-6">
                            <div className={`${block} h-12 w-full rounded-lg`} />
                            <div className={`${block} h-12 w-full rounded-lg`} />
                        </div>
                    </div>
                </div>

                {/* Below the fold content placehgolders */}
                <div className="mt-16 space-y-12">
                    <div className={`${block} h-96 w-full rounded-2xl opacity-50`} />
                </div>
            </div>

            {/* Related Products Skeleton */}
            <div className="content-container mb-10 mt-16">
                <SkeletonRelatedProducts />
            </div>
        </>
    )
}
