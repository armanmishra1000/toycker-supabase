"use client"

import { useState, useEffect } from "react"
import { PlusIcon } from "@heroicons/react/24/outline"
import { type HomeBanner } from "@/lib/types/home-banners"
import BannersList from "./banners-list"
import BannerFormModal from "./banner-form-modal"
import { ProtectedAction } from "@/lib/permissions/components/protected-action"
import { PERMISSIONS } from "@/lib/permissions"

type Props = {
    initialBanners: HomeBanner[]
}

export default function BannersManager({ initialBanners }: Props) {
    const [banners, setBanners] = useState<HomeBanner[]>(initialBanners)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingBanner, setEditingBanner] = useState<HomeBanner | null>(null)

    const handleAddBanner = () => {
        setEditingBanner(null)
        setIsModalOpen(true)
    }

    const handleEditBanner = (banner: HomeBanner) => {
        setEditingBanner(banner)
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setEditingBanner(null)
    }

    const handleSuccess = (updatedBanner: HomeBanner) => {
        setBanners((prev) => {
            const exists = prev.find(b => b.id === updatedBanner.id)
            if (exists) {
                return prev.map(b => b.id === updatedBanner.id ? updatedBanner : b)
            }
            return [...prev, updatedBanner]
        })
    }

    const handleDelete = (id: string) => {
        setBanners(prev => prev.filter(b => b.id !== id))
    }

    const handleToggle = (id: string, isActive: boolean) => {
        setBanners(prev => prev.map(b => b.id === id ? { ...b, is_active: isActive } : b))
    }

    const handleReorder = (newBanners: HomeBanner[]) => {
        setBanners(newBanners)
    }

    // Sync with server data when it changes
    useEffect(() => {
        setBanners(initialBanners)
    }, [initialBanners])

    const MAX_BANNERS = 6
    const isLimitReached = banners.length >= MAX_BANNERS

    return (
        <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">Configure Banners</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-slate-500 font-medium">
                            {banners.length} of {MAX_BANNERS} banners configured
                        </p>
                        {isLimitReached && (
                            <span className="text-[10px] bg-amber-100 text-amber-700 font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                                Limit Reached
                            </span>
                        )}
                    </div>
                </div>
                <ProtectedAction permission={PERMISSIONS.HOME_SETTINGS_UPDATE} hideWhenDisabled>
                    <button
                        onClick={handleAddBanner}
                        disabled={isLimitReached}
                        className={`inline-flex items-center gap-2 px-6 py-3 text-white text-sm font-bold rounded-xl transition-all duration-300 ${isLimitReached
                            ? "bg-slate-300 cursor-not-allowed opacity-70"
                            : "bg-indigo-600 hover:bg-slate-900 hover:shadow-xl hover:shadow-indigo-100"
                            }`}
                    >
                        <PlusIcon className="h-4 w-4 stroke-[3]" />
                        {isLimitReached ? "Limit Reached" : "Create New Banner"}
                    </button>
                </ProtectedAction>
            </div>

            <BannersList
                banners={banners}
                onEdit={handleEditBanner}
                onDelete={handleDelete}
                onToggle={handleToggle}
                onReorder={handleReorder}
            />

            <BannerFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSuccess={handleSuccess}
                banner={editingBanner}
                defaultSortOrder={banners.length}
            />
        </div>
    )
}
