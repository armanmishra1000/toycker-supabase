"use client"

import { useState, useEffect } from "react"
import { XMarkIcon } from "@heroicons/react/24/outline"
import { createExclusiveCollection, updateExclusiveCollection } from "@/lib/actions/home-exclusive-collections"
import { type HomeExclusiveCollection, type ExclusiveCollectionFormData } from "@/lib/types/home-exclusive-collections"
import { useToast } from "@modules/common/context/toast-context"
import { useRouter } from "next/navigation"
import ImageUploader from "../../image-uploader"
import ProductSelector from "../../product-selector"

type Props = {
    isOpen: boolean
    onClose: () => void
    onSuccess: (collection: HomeExclusiveCollection) => void
    collection?: HomeExclusiveCollection | null
    defaultSortOrder?: number
}

export default function CollectionFormModal({ isOpen, onClose, onSuccess, collection, defaultSortOrder }: Props) {
    const router = useRouter()
    const { showToast } = useToast()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState<Partial<ExclusiveCollectionFormData>>({
        product_id: "",
        video_url: "",
        poster_url: "",
        video_duration: undefined,
        sort_order: 0,
        is_active: true,
    })

    // Reset form when modal opens/closes or collection changes
    useEffect(() => {
        if (isOpen) {
            if (collection) {
                setFormData({
                    product_id: collection.product_id,
                    video_url: collection.video_url,
                    poster_url: collection.poster_url || "",
                    video_duration: collection.video_duration || undefined,
                    sort_order: collection.sort_order,
                    is_active: collection.is_active,
                })
            } else {
                setFormData({
                    product_id: "",
                    video_url: "",
                    poster_url: "",
                    video_duration: undefined,
                    sort_order: defaultSortOrder || 0,
                    is_active: true,
                })
            }
        }
    }, [isOpen, collection, defaultSortOrder])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.product_id || !formData.video_url) {
            showToast("Product and video are required", "error")
            return
        }

        setIsSubmitting(true)

        try {
            const data: ExclusiveCollectionFormData = {
                product_id: formData.product_id,
                video_url: formData.video_url,
                poster_url: formData.poster_url || "",
                video_duration: formData.video_duration || null,
                sort_order: formData.sort_order || 0,
                is_active: formData.is_active ?? true,
            }

            const result = collection
                ? await updateExclusiveCollection(collection.id, data)
                : await createExclusiveCollection(data)

            if (result.error) {
                showToast(result.error, "error")
            } else if (result.collection) {
                showToast(
                    collection ? "Collection updated successfully" : "Collection created successfully",
                    "success"
                )
                onSuccess(result.collection)
                router.refresh()
                onClose()
            }
        } catch (error) {
            console.error("Error saving collection:", error)
            showToast("An unexpected error occurred", "error")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-black/50 transition-opacity"
                    onClick={onClose}
                />

                {/* Modal */}
                <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">
                            {collection ? "Edit Collection" : "Add New Collection"}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Product Selector */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Select Product *
                            </label>
                            <ProductSelector
                                value={formData.product_id || ""}
                                onChange={(productId) => setFormData({ ...formData, product_id: productId })}
                                disabled={!!collection} // Can't change product after creation
                            />
                            {collection && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Product cannot be changed after creation
                                </p>
                            )}
                        </div>

                        {/* Video Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Video *
                            </label>
                            <ImageUploader
                                folder="exclusive-videos"
                                value={formData.video_url || ""}
                                onChange={(url) => setFormData({ ...formData, video_url: url })}
                                acceptedFormats={["video/mp4", "video/webm"]}
                                maxSizeMB={50}
                            />
                        </div>

                        {/* Poster Image Upload (Optional) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Poster Image (optional)
                            </label>
                            <ImageUploader
                                folder="banners"
                                value={formData.poster_url || ""}
                                onChange={(url) => setFormData({ ...formData, poster_url: url })}
                                acceptedFormats={["image/jpeg", "image/png", "image/webp"]}
                                maxSizeMB={5}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Used as thumbnail before video loads
                            </p>
                        </div>

                        {/* Video Duration (Optional) */}
                        <div>
                            <label htmlFor="video_duration" className="block text-sm font-medium text-gray-700 mb-1">
                                Video Duration (seconds, optional)
                            </label>
                            <input
                                id="video_duration"
                                type="number"
                                min="1"
                                value={formData.video_duration || ""}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        video_duration: e.target.value ? parseInt(e.target.value) : undefined,
                                    })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                placeholder="e.g., 30"
                            />
                        </div>

                        {/* Active Toggle */}
                        <div className="flex items-center gap-2">
                            <input
                                id="is_active"
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                            />
                            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                                Active (show on homepage)
                            </label>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || !formData.product_id || !formData.video_url}
                                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting
                                    ? "Saving..."
                                    : collection
                                        ? "Update Collection"
                                        : "Create Collection"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
