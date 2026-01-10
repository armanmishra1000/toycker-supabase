"use client"

import { useState } from "react"
import { type HomeBanner } from "@/lib/types/home-banners"
import { type HomeExclusiveCollection } from "@/lib/types/home-exclusive-collections"
import BannersManager from "@/modules/admin/components/home-settings/banners-manager"
import ExclusiveCollectionsManager from "@/modules/admin/components/home-settings/exclusive-collections-manager"
import {
    LayoutDashboard,
    PictureInPicture,
    Video,
    Settings2
} from "lucide-react"

type Props = {
    banners: HomeBanner[]
    collections: HomeExclusiveCollection[]
}

export default function HomeSettingsClient({ banners, collections }: Props) {
    const [activeTab, setActiveTab] = useState<"banners" | "collections">("banners")

    const tabs = [
        {
            id: "banners",
            label: "Hero Banners",
            description: "Large promotional banners shown at the top of the homepage.",
            icon: PictureInPicture,
            count: banners.length
        },
        {
            id: "collections",
            label: "Exclusive Collections",
            description: "Product collections featured with full-screen video content.",
            icon: Video,
            count: collections.length
        }
    ]

    return (
        <div className="max-w-[1200px] mx-auto pb-20">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-emerald-600 mb-1">
                        <Settings2 className="w-4 h-4" />
                        <span className="text-xs font-bold tracking-wider uppercase">Content Management</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Home Appearance</h1>
                    <p className="mt-1 text-gray-500 max-w-2xl">
                        Customize how your homepage looks to customers. Changes here reflect instantly on the storefront.
                    </p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-col gap-6">
                <div className="flex overflow-x-auto pb-1 gap-2 border-b border-gray-200">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2.5 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all duration-200 ${activeTab === tab.id
                                    ? "border-emerald-500 text-emerald-600 bg-emerald-50/50"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                }`}
                        >
                            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-emerald-500" : "text-gray-400"}`} />
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === tab.id
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-gray-100 text-gray-500"
                                    }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="p-0 sm:p-6 lg:p-8">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-900">
                                {tabs.find(t => t.id === activeTab)?.label}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
