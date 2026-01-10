import React from "react"
import Breadcrumbs from "@modules/common/components/breadcrumbs"

export default function CheckoutLoading() {
    return (
        <div className="content-container px-4 py-6 sm:px-6 sm:py-8">
            {/* Heading Skeleton */}
            <div className="h-8 w-48 bg-slate-200 rounded-lg mb-4 sm:mb-6 animate-pulse" />

            {/* Breadcrumbs */}
            <Breadcrumbs
                items={[
                    { label: "Cart", href: "/cart" },
                    { label: "Checkout" },
                ]}
                className="mb-6 sm:mb-8 opacity-50"
            />

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_420px] gap-4 sm:gap-6">
                {/* Left Column: Forms */}
                <div className="w-full flex flex-col gap-4 sm:gap-6">
                    {/* Shipping Address Section Skeleton */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
                        {/* Section Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 bg-slate-200 rounded-lg animate-pulse" />
                            <div className="h-6 w-40 bg-slate-200 rounded-lg animate-pulse" />
                        </div>

                        {/* Form Fields */}
                        <div className="space-y-4">
                            {/* Email Field */}
                            <div>
                                <div className="h-4 w-20 bg-slate-200 rounded-lg animate-pulse mb-2" />
                                <div className="h-11 w-full bg-slate-200 rounded-lg animate-pulse" />
                            </div>

                            {/* Name Fields Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="h-4 w-24 bg-slate-200 rounded-lg animate-pulse mb-2" />
                                    <div className="h-11 w-full bg-slate-200 rounded-lg animate-pulse" />
                                </div>
                                <div>
                                    <div className="h-4 w-24 bg-slate-200 rounded-lg animate-pulse mb-2" />
                                    <div className="h-11 w-full bg-slate-200 rounded-lg animate-pulse" />
                                </div>
                            </div>

                            {/* Address Field */}
                            <div>
                                <div className="h-4 w-28 bg-slate-200 rounded-lg animate-pulse mb-2" />
                                <div className="h-11 w-full bg-slate-200 rounded-lg animate-pulse" />
                            </div>

                            {/* City, State, Postal Code Row */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <div className="h-4 w-16 bg-slate-200 rounded-lg animate-pulse mb-2" />
                                    <div className="h-11 w-full bg-slate-200 rounded-lg animate-pulse" />
                                </div>
                                <div>
                                    <div className="h-4 w-16 bg-slate-200 rounded-lg animate-pulse mb-2" />
                                    <div className="h-11 w-full bg-slate-200 rounded-lg animate-pulse" />
                                </div>
                                <div>
                                    <div className="h-4 w-24 bg-slate-200 rounded-lg animate-pulse mb-2" />
                                    <div className="h-11 w-full bg-slate-200 rounded-lg animate-pulse" />
                                </div>
                            </div>

                            {/* Phone Field */}
                            <div>
                                <div className="h-4 w-20 bg-slate-200 rounded-lg animate-pulse mb-2" />
                                <div className="h-11 w-full bg-slate-200 rounded-lg animate-pulse" />
                            </div>
                        </div>
                    </div>

                    {/* Payment Method Section Skeleton */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
                        {/* Section Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 bg-slate-200 rounded-lg animate-pulse" />
                            <div className="h-6 w-40 bg-slate-200 rounded-lg animate-pulse" />
                        </div>

                        {/* Payment Options */}
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-16 w-full bg-slate-200 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Summary */}
                <div className="w-full lg:sticky lg:top-4 h-fit">
                    <div className="flex flex-col gap-3 sm:gap-4">
                        {/* Order Summary Card */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            {/* Header */}
                            <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-gray-100">
                                <div className="h-7 w-36 bg-slate-200 rounded-lg animate-pulse" />
                            </div>

                            {/* Rewards Section */}
                            <div className="px-5 sm:px-6 pt-4">
                                <div className="h-24 w-full bg-slate-200 rounded-lg animate-pulse" />
                            </div>

                            {/* Product List */}
                            <div className="px-5 sm:px-6 py-4">
                                <div className="space-y-3">
                                    {[1, 2].map((i) => (
                                        <div key={i} className="flex gap-3">
                                            <div className="w-16 h-16 bg-slate-200 rounded-lg animate-pulse shrink-0" />
                                            <div className="flex-1">
                                                <div className="h-4 w-3/4 bg-slate-200 rounded-lg animate-pulse mb-2" />
                                                <div className="h-4 w-1/2 bg-slate-200 rounded-lg animate-pulse" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Pricing Section */}
                            <div className="px-5 sm:px-6 py-4 bg-gray-50/50 border-t border-gray-100">
                                <div className="space-y-3">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <div className="h-4 w-24 bg-slate-200 rounded-lg animate-pulse" />
                                            <div className="h-4 w-20 bg-slate-200 rounded-lg animate-pulse" />
                                        </div>
                                    ))}
                                </div>

                                {/* Final Total */}
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <div className="flex items-end justify-between">
                                        <div className="flex flex-col gap-1">
                                            <div className="h-3 w-20 bg-slate-200 rounded-lg animate-pulse" />
                                            <div className="h-3 w-24 bg-slate-200 rounded-lg animate-pulse" />
                                        </div>
                                        <div className="h-10 w-32 bg-slate-200 rounded-lg animate-pulse" />
                                    </div>
                                </div>
                            </div>

                            {/* Discount Section */}
                            <div className="px-5 sm:px-6 py-4 border-t border-gray-100">
                                <div className="h-12 w-full bg-slate-200 rounded-xl animate-pulse" />
                            </div>
                        </div>

                        {/* Complete Order Card */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                            <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4">
                                <div className="h-7 w-36 bg-slate-200 rounded-lg animate-pulse mb-4" />

                                {/* Security Badge */}
                                <div className="h-12 w-full bg-slate-200 rounded-lg animate-pulse mb-3" />

                                {/* Terms Text */}
                                <div className="h-4 w-full bg-slate-200 rounded-lg animate-pulse mb-3" />

                                {/* Place Order Button */}
                                <div className="h-14 w-full bg-slate-200 rounded-full animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
