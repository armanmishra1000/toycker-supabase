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
            <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">Exclusive Collections</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-slate-500 font-medium">
                            {collections.length} of {MAX_COLLECTIONS} collections featured
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
                        onClick={handleAddCollection}
                        disabled={isLimitReached}
                        className={`inline-flex items-center gap-2 px-6 py-3 text-white text-sm font-bold rounded-xl transition-all duration-300 ${isLimitReached
                            ? "bg-slate-300 cursor-not-allowed opacity-70"
                            : "bg-indigo-600 hover:bg-slate-900 hover:shadow-xl hover:shadow-indigo-100"
                            }`}
                    >
                        <PlusIcon className="h-4 w-4 stroke-[3]" />
                        {isLimitReached ? "Limit Reached" : "Feature New Collection"}
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
