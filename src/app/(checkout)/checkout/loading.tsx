import React from "react"
import Breadcrumbs from "@modules/common/components/breadcrumbs"

export default function CheckoutLoading() {
    return (
        <div className="content-container px-4 py-6 sm:px-6 sm:py-8 animate-pulse">
            {/* Skeleton Heading */}
            <div className="h-8 w-48 bg-slate-200 rounded-lg mb-4 sm:mb-6" />

            {/* Breadcrumbs */}
            <Breadcrumbs
                items={[
                    { label: "Cart", href: "/cart" },
                    { label: "Checkout" },
                ]}
                className="mb-6 sm:mb-8 opacity-50"
            />

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_420px] gap-4 sm:gap-6">
                {/* Left Column Skeleton */}
                <div className="space-y-4">
                    <div className="h-[400px] w-full bg-white rounded-xl border border-gray-100 shadow-sm" />
                    <div className="h-[200px] w-full bg-white rounded-xl border border-gray-100 shadow-sm" />
                </div>

                {/* Right Column Skeleton */}
                <div className="space-y-4">
                    <div className="h-[500px] w-full bg-white rounded-xl border border-gray-100 shadow-sm" />
                </div>
            </div>
        </div>
    )
}
