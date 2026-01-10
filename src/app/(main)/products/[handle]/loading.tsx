export default function Loading() {
    const block = "animate-pulse bg-slate-200"

    return (
        <div className="content-container py-6 lg:py-10">
            {/* Breadcrumbs skeleton */}
            <div className="flex items-center gap-2 mb-6">
                <div className={`${block} w-12 h-4 rounded`} />
                <div className="text-slate-200">/</div>
                <div className={`${block} w-32 h-4 rounded`} />
            </div>

            {/* Two-column layout */}
            <div className="flex flex-col gap-10 xl:flex-row xl:items-start">
                {/* Left side - Image gallery skeleton */}
                <div className="w-full xl:w-3/5">
                    <div className="flex gap-4">
                        {/* Thumbnail column */}
                        <div className="hidden md:flex flex-col gap-2 w-20">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className={`${block} aspect-square rounded-lg`} />
                            ))}
                        </div>

                        {/* Main image */}
                        <div className={`${block} flex-1 aspect-square rounded-2xl`} />
                    </div>
                </div>

                {/* Right side - Product details skeleton */}
                <div className="w-full xl:w-2/5 space-y-6">
                    {/* Product title */}
                    <div className={`${block} h-8 w-3/4 rounded`} />

                    {/* Price section */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className={`${block} h-8 w-24 rounded`} />
                            <div className={`${block} h-6 w-24 rounded opacity-50`} />
                            <div className={`${block} h-6 w-20 rounded-full`} />
                        </div>
                        <div className={`${block} h-6 w-32 rounded`} />
                    </div>

                    {/* Color options */}
                    <div className="space-y-2">
                        <div className={`${block} h-5 w-16 rounded`} />
                        <div className="flex gap-2">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className={`${block} h-10 w-10 rounded-full`} />
                            ))}
                        </div>
                    </div>

                    {/* Actions (Size selector, etc.) */}
                    <div className="space-y-2">
                        <div className={`${block} h-5 w-20 rounded`} />
                        <div className={`${block} h-12 w-full rounded-lg`} />
                    </div>

                    {/* Quantity selector */}
                    <div className="space-y-2">
                        <div className={`${block} h-5 w-20 rounded`} />
                        <div className={`${block} h-12 w-32 rounded-lg`} />
                    </div>

                    {/* Add to Cart & Buy Now buttons */}
                    <div className="space-y-3">
                        <div className={`${block} h-12 w-full rounded-full`} />
                        <div className={`${block} h-12 w-full rounded-full`} />
                    </div>

                    {/* Additional info (Ask a question, Share) */}
                    <div className="flex gap-4 pt-4 border-t border-gray-200">
                        <div className={`${block} h-6 w-32 rounded`} />
                        <div className={`${block} h-6 w-20 rounded`} />
                    </div>

                    {/* Order information */}
                    <div className="space-y-2 pt-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className={`${block} h-5 w-5 rounded`} />
                                <div className={`${block} h-4 w-48 rounded`} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Product tabs skeleton */}
            <div className="mt-12 space-y-4">
                <div className="flex gap-4 border-b border-gray-200">
                    <div className={`${block} h-10 w-32 rounded-t`} />
                    <div className={`${block} h-10 w-40 rounded-t`} />
                </div>
                <div className="space-y-2">
                    <div className={`${block} h-4 w-full rounded`} />
                    <div className={`${block} h-4 w-5/6 rounded`} />
                    <div className={`${block} h-4 w-4/6 rounded`} />
                </div>
            </div>

            {/* Customer Reviews skeleton */}
            <div className="mt-12 space-y-6">
                <div className={`${block} h-8 w-48 rounded`} />
                <div className="flex items-center gap-4">
                    <div className={`${block} h-6 w-24 rounded`} />
                    <div className={`${block} h-10 w-32 rounded-full`} />
                </div>
            </div>

            {/* Related products skeleton */}
            <div className="mt-16 space-y-6">
                <div className={`${block} h-8 w-64 rounded mx-auto`} />
                <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="space-y-3">
                            <div className={`${block} aspect-square rounded-2xl`} />
                            <div className={`${block} h-5 w-3/4 rounded`} />
                            <div className={`${block} h-6 w-1/2 rounded`} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
