import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"
import repeat from "@lib/util/repeat"

export default function Loading() {
    return (
        <div className="py-12 min-h-[calc(100vh-64px)] bg-slate-50/50 animate-pulse">
            <div className="content-container flex flex-col justify-center items-center gap-y-8 max-w-4xl h-full w-full">
                {/* Celebratory Header Card Skeleton */}
                <div className="w-full bg-white rounded-3xl border border-emerald-50 p-8 sm:p-12 shadow-xl shadow-emerald-900/5 flex flex-col items-center text-center relative overflow-hidden">
                    <div className="w-20 h-20 bg-emerald-100 rounded-2xl mb-6 shadow-sm"></div>
                    <div className="w-48 h-10 bg-slate-100 rounded-xl mb-3"></div>
                    <div className="w-64 h-6 bg-slate-100 rounded-lg"></div>
                </div>

                {/* Main Content Grid Skeleton */}
                <div className="flex flex-col gap-8 w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
                        {/* Order Details Skeleton */}
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-2">
                                    <div className="w-24 h-4 bg-slate-100 rounded"></div>
                                    <div className="w-48 h-6 bg-slate-100 rounded"></div>
                                    <div className="w-32 h-5 bg-slate-100 rounded"></div>
                                </div>
                                <div className="space-y-2 md:items-end">
                                    <div className="w-24 h-4 bg-slate-100 rounded"></div>
                                    <div className="w-20 h-8 bg-slate-100 rounded-xl"></div>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-6 items-center justify-between pb-6 border-b border-slate-100">
                                <div className="space-y-2">
                                    <div className="w-20 h-3 bg-slate-100 rounded"></div>
                                    <div className="w-32 h-5 bg-slate-100 rounded"></div>
                                </div>
                                <div className="space-y-2 md:items-end flex flex-col items-end">
                                    <div className="w-24 h-3 bg-slate-100 rounded"></div>
                                    <div className="w-16 h-7 bg-blue-50 rounded"></div>
                                </div>
                            </div>
                        </div>

                        {/* Order Summary Skeleton */}
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden pt-8">
                            <div className="px-6 sm:px-10 mb-6">
                                <div className="w-40 h-7 bg-slate-100 rounded-lg"></div>
                            </div>
                            <div className="px-6 sm:px-10">
                                <table className="w-full">
                                    <tbody>
                                        {repeat(3).map((i) => (
                                            <SkeletonLineItem key={i} />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="bg-slate-50/80 p-6 sm:p-10 border-t border-dashed border-slate-200 space-y-4">
                                <div className="flex justify-between">
                                    <div className="w-20 h-4 bg-slate-100 rounded"></div>
                                    <div className="w-24 h-4 bg-slate-200 rounded"></div>
                                </div>
                                <div className="flex justify-between">
                                    <div className="w-20 h-4 bg-slate-100 rounded"></div>
                                    <div className="w-24 h-4 bg-slate-200 rounded"></div>
                                </div>
                                <div className="pt-4 border-t border-slate-200 border-dashed flex justify-between items-center">
                                    <div className="w-24 h-3 bg-slate-100 rounded"></div>
                                    <div className="w-32 h-10 bg-slate-200 rounded-xl"></div>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Details Card Skeleton */}
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10">
                            <div className="w-40 h-7 bg-slate-100 rounded-lg mb-6"></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <div className="w-24 h-4 bg-slate-100 rounded"></div>
                                    <div className="w-full h-20 bg-slate-50 rounded-2xl"></div>
                                </div>
                                <div className="space-y-3">
                                    <div className="w-24 h-4 bg-slate-100 rounded"></div>
                                    <div className="w-full h-12 bg-slate-50 rounded-2xl"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
