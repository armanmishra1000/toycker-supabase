"use client"

import { useState } from "react"
import { type HomeBanner } from "@/lib/types/home-banners"
import { type HomeExclusiveCollection } from "@/lib/types/home-exclusive-collections"
import { type HomeReview } from "@/lib/actions/home-reviews"
import { type ReviewWithMedia } from "@/lib/actions/reviews"
import BannersManager from "@/modules/admin/components/home-settings/banners-manager"
import ExclusiveCollectionsManager from "@/modules/admin/components/home-settings/exclusive-collections-manager"
import ReviewsManager from "@/modules/admin/components/home-settings/reviews-manager"

type Props = {
    banners: HomeBanner[]
    collections: HomeExclusiveCollection[]
    homeReviews: HomeReview[]
    allApprovedReviews: ReviewWithMedia[]
}

export default function HomeSettingsClient({ banners, collections, homeReviews, allApprovedReviews }: Props) {
    const [activeTab, setActiveTab] = useState<"banners" | "collections" | "reviews">("banners")

    const tabs = [
        {
            id: "banners",
            label: "Hero Banners",
            description: "Large promotional banners shown at the top of the homepage.",
            count: banners.length
        },
        {
            id: "collections",
            label: "Exclusive Collections",
            description: "Product collections featured with full-screen video content.",
            count: collections.length
        },
        {
            id: "reviews",
            label: "Customer Reviews",
            description: "Up to 12 approved reviews featured on the homepage.",
            count: homeReviews.length
        }
    ]

    return (
        <>
            {/* Header section with glass effect on scroll (conceptual) */}
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-gray-900">Home Appearance</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Manage your storefront's first impression. Customize banners, featured collections, and top-rated customer reviews.
                </p>
            </div>

            <div className="flex flex-col gap-8">
                {/* Modern Tab Navigation */}
                <div className="flex items-center gap-1 bg-gray-100/50 p-1 rounded-xl w-fit border border-gray-200/50">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id
                                ? "bg-white text-black shadow-sm"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                                }`}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`ml-1 px-2 py-0.5 rounded-md text-[10px] font-black ${activeTab === tab.id
                                    ? "bg-indigo-50 text-indigo-600"
                                    : "bg-slate-200 text-slate-500"
                                    }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content Area with refined borders and shadows */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden min-h-[600px]">
                    <div className="p-6 sm:p-10">
                        <div className="border-b border-gray-200 pb-8">
                            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                {tabs.find(t => t.id === activeTab)?.label}
                                <div className="h-1 w-1 rounded-full bg-gray-300" />
                                <span className="text-sm font-medium text-gray-400">Settings</span>
                            </h2>
                            <p className="text-sm text-gray-500 mt-2 font-medium">
                                {tabs.find(t => t.id === activeTab)?.description}
                            </p>
                        </div>

                        <div className="mt-8">
                            {activeTab === "banners" && (
                                <BannersManager initialBanners={banners} />
                            )}
                            {activeTab === "collections" && (
                                <ExclusiveCollectionsManager initialCollections={collections} />
                            )}
                            {activeTab === "reviews" && (
                                <ReviewsManager
                                    initialHomeReviews={homeReviews}
                                    allApprovedReviews={allApprovedReviews}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
