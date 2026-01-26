"use client"

import { useState, useEffect } from "react"
import { PlusIcon } from "@heroicons/react/24/outline"
import { type HomeExclusiveCollection } from "@/lib/types/home-exclusive-collections"
import CollectionsList from "./collections-list"
import CollectionFormModal from "./collection-form-modal"
import { ProtectedAction } from "@/lib/permissions/components/protected-action"
import { PERMISSIONS } from "@/lib/permissions"

type Props = {
    initialCollections: HomeExclusiveCollection[]
}

export default function ExclusiveCollectionsManager({ initialCollections }: Props) {
    const [collections, setCollections] = useState<HomeExclusiveCollection[]>(initialCollections)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingCollection, setEditingCollection] = useState<HomeExclusiveCollection | null>(null)

    // Sync with server data
    useEffect(() => {
        setCollections(initialCollections)
    }, [initialCollections])

    const handleAddCollection = () => {
        setEditingCollection(null)
        setIsModalOpen(true)
    }

    const handleEditCollection = (collection: HomeExclusiveCollection) => {
        setEditingCollection(collection)
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setEditingCollection(null)
    }

    const handleSuccess = (updatedCollection: HomeExclusiveCollection) => {
        setCollections((prev) => {
            const exists = prev.find(c => c.id === updatedCollection.id)
            if (exists) {
                return prev.map(c => c.id === updatedCollection.id ? updatedCollection : c)
            }
            return [...prev, updatedCollection]
        })
    }

    const handleDelete = (id: string) => {
        setCollections(prev => prev.filter(c => c.id !== id))
    }

    const handleToggle = (id: string, isActive: boolean) => {
        setCollections(prev => prev.map(c => c.id === id ? { ...c, is_active: isActive } : c))
    }

    const handleReorder = (newCollections: HomeExclusiveCollection[]) => {
        setCollections(newCollections)
    }

    const MAX_COLLECTIONS = 8
    const isLimitReached = collections.length >= MAX_COLLECTIONS

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Featured Collections</h3>
                    <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-500">
                            {collections.length} of {MAX_COLLECTIONS} collections active
                        </p>
                        {isLimitReached && (
                            <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                                Limit Reached
                            </span>
                        )}
                    </div>
                </div>
                <ProtectedAction permission={PERMISSIONS.HOME_SETTINGS_UPDATE} hideWhenDisabled>
                    <button
                        onClick={handleAddCollection}
                        disabled={isLimitReached}
                        className={`inline-flex items-center gap-2 px-5 py-2.5 text-white text-sm font-bold rounded-xl transition-all duration-300 ${isLimitReached
                            ? "bg-gray-400 cursor-not-allowed opacity-70"
                            : "bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200"
                            }`}
                    >
                        <PlusIcon className="h-4 w-4 stroke-[3]" />
                        {isLimitReached ? "Limit Reached" : "Add Collection"}
                    </button>
                </ProtectedAction>
            </div>

            <CollectionsList
                collections={collections}
                onEdit={handleEditCollection}
                onDelete={handleDelete}
                onToggle={handleToggle}
                onReorder={handleReorder}
            />

            <CollectionFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSuccess={handleSuccess}
                collection={editingCollection}
                defaultSortOrder={collections.length}
            />
        </div>
    )
}
