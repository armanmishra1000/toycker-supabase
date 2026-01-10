export default function CartLoading() {
    return (
        <div className="min-h-screen py-6 sm:py-8 lg:py-12">
            <div className="content-container px-3 sm:px-4">
                {/* Main Cart Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] 2xl:grid-cols-[1fr_450px] gap-6 sm:gap-8 lg:gap-10 xl:gap-12 2xl:gap-14">
                    {/* Left Column: Cart Items */}
                    <div className="flex flex-col gap-y-4 sm:gap-y-6">
                        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-sm border border-gray-200">
                            {/* Cart Items Header Skeleton */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="h-7 w-32 bg-slate-200 rounded-lg animate-pulse" />
                                <div className="h-6 w-20 bg-slate-200 rounded-lg animate-pulse" />
                            </div>

                            {/* Cart Item Skeletons */}
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex gap-4 pb-6 mb-6 border-b border-slate-100 last:border-0 last:mb-0 last:pb-0">
                                    {/* Image Skeleton */}
                                    <div className="w-24 h-24 sm:w-28 sm:h-28 bg-slate-200 rounded-xl animate-pulse shrink-0" />

                                    {/* Content Skeleton */}
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="h-5 w-3/4 bg-slate-200 rounded-lg animate-pulse mb-2" />
                                            <div className="h-4 w-1/2 bg-slate-200 rounded-lg animate-pulse mb-3" />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            {/* Quantity Skeleton */}
                                            <div className="h-10 w-28 bg-slate-200 rounded-lg animate-pulse" />

                                            {/* Price Skeleton */}
                                            <div className="h-6 w-20 bg-slate-200 rounded-lg animate-pulse" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Summary Skeleton */}
                    <div className="lg:sticky lg:top-8 h-fit">
                        <div className="flex flex-col gap-4 sm:gap-6">
                            {/* Order Summary Card */}
                            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-sm border border-gray-200">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-200 rounded-xl animate-pulse" />
                                        <div>
                                            <div className="h-6 w-32 bg-slate-200 rounded-lg animate-pulse mb-1" />
                                            <div className="h-4 w-16 bg-slate-200 rounded-lg animate-pulse" />
                                        </div>
                                    </div>
                                </div>

                                {/* Shipping Progress Skeleton */}
                                <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 mb-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-slate-200 rounded-lg animate-pulse" />
                                            <div>
                                                <div className="h-4 w-32 bg-slate-200 rounded-lg animate-pulse mb-1" />
                                                <div className="h-4 w-40 bg-slate-200 rounded-lg animate-pulse" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="h-1.5 bg-slate-200 rounded-full animate-pulse" />
                                </div>

                                {/* Promo Code Skeleton */}
                                <div className="bg-white rounded-2xl p-1 border border-gray-200 mb-6">
                                    <div className="h-12 bg-slate-200 rounded-xl animate-pulse" />
                                </div>

                                {/* Totals Skeleton */}
                                <div className="space-y-3 mb-6">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <div className="h-4 w-24 bg-slate-200 rounded-lg animate-pulse" />
                                            <div className="h-4 w-20 bg-slate-200 rounded-lg animate-pulse" />
                                        </div>
                                    ))}
                                </div>

                                {/* Final Total Skeleton */}
                                <div className="pt-5 border-t border-slate-100">
                                    <div className="flex items-end justify-between">
                                        <div className="flex flex-col gap-1">
                                            <div className="h-3 w-20 bg-slate-200 rounded-lg animate-pulse" />
                                            <div className="h-3 w-24 bg-slate-200 rounded-lg animate-pulse" />
                                        </div>
                                        <div className="h-10 w-32 bg-slate-200 rounded-lg animate-pulse" />
                                    </div>
                                </div>

                                {/* Checkout Button Skeleton */}
                                <div className="mt-6">
                                    <div className="h-14 w-full bg-slate-200 rounded-2xl animate-pulse mb-3" />
                                    <div className="h-8 w-full bg-slate-200 rounded-lg animate-pulse" />
                                </div>
                            </div>

                            {/* Trust Badges Skeleton */}
                            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                                <div className="grid grid-cols-3 gap-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex flex-col items-center text-center">
                                            <div className="w-12 h-12 bg-slate-200 rounded-2xl animate-pulse mb-3" />
                                            <div className="h-3 w-16 bg-slate-200 rounded-lg animate-pulse mb-1" />
                                            <div className="h-3 w-12 bg-slate-200 rounded-lg animate-pulse" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Help Text Skeleton */}
                            <div className="flex flex-col items-center gap-1 mt-2">
                                <div className="h-3 w-40 bg-slate-200 rounded-lg animate-pulse" />
                                <div className="h-4 w-32 bg-slate-200 rounded-lg animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
