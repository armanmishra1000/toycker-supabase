"use client"

import { useState, useEffect } from "react"
import { X, Play, Package, Video, ImageIcon, Clock, CheckCircle2 } from "lucide-react"
import { createExclusiveCollection, updateExclusiveCollection } from "@/lib/actions/home-exclusive-collections"
import { type HomeExclusiveCollection, type ExclusiveCollectionFormData } from "@/lib/types/home-exclusive-collections"
import { useToast } from "@modules/common/context/toast-context"
import { useRouter } from "next/navigation"
import ImageUploader from "../../image-uploader"
import ProductSelector from "../../product-selector"

type Props = {
    isOpen: boolean
    onClose: () => void
    onSuccess: (_collection: HomeExclusiveCollection) => void
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
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
                    onClick={onClose}
                />

                {/* Modal */}
                <div className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
                    {/* Decorative Header Background */}
                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-indigo-50 via-slate-50/50 to-transparent pointer-events-none" />

                    {/* Header */}
                    <div className="relative flex items-center justify-between px-8 py-6 border-b border-slate-100">
                        <div>
                            <div className="flex items-center gap-2 text-indigo-600 mb-1">
                                <Play className="w-4 h-4" />
                                <span className="text-[10px] font-black tracking-[0.2em] uppercase">Cinematic Feature</span>
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                {collection ? "Refine Collection" : "Feature New Collection"}
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2.5 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all duration-300 group"
                        >
                            <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="relative p-8 space-y-8">
                        {/* Product Selector */}
                        <div className="space-y-3">
                            <label className="inline-flex items-center gap-2 text-sm font-black text-slate-700 ml-1">
                                <Package className="w-4 h-4 text-indigo-500" />
                                Highlighted Product
                            </label>
                            <div className="rounded-2xl overflow-hidden ring-1 ring-slate-100">
                                <ProductSelector
                                    value={formData.product_id || ""}
                                    onChange={(productId) => setFormData({ ...formData, product_id: productId })}
                                />
                            </div>
                        </div>

                        {/* Video Upload */}
                        <div className="space-y-3">
                            <label className="inline-flex items-center gap-2 text-sm font-black text-slate-700 ml-1">
                                <Video className="w-4 h-4 text-indigo-500" />
                                Immersive Video Asset
                            </label>
                            <div className="rounded-3xl overflow-hidden ring-1 ring-slate-100 bg-slate-50/50 p-2">
                                <ImageUploader
                                    folder="exclusive-videos"
                                    value={formData.video_url || ""}
                                    onChange={(url) => setFormData({ ...formData, video_url: url })}
                                    acceptedFormats={["video/mp4", "video/webm"]}
                                    maxSizeMB={50}
                                />
                            </div>
                        </div>

                        {/* Poster Image Upload (Optional) */}
                        <div className="space-y-3">
                            <label className="inline-flex items-center gap-2 text-sm font-black text-slate-700 ml-1">
                                <ImageIcon className="w-4 h-4 text-slate-400" />
                                Poster Image
                                <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-1">Optional</span>
                            </label>
                            <div className="rounded-3xl overflow-hidden ring-1 ring-slate-100 bg-slate-50/50 p-2">
                                <ImageUploader
                                    folder="banners"
                                    value={formData.poster_url || ""}
                                    onChange={(url) => setFormData({ ...formData, poster_url: url })}
                                    acceptedFormats={["image/jpeg", "image/png", "image/webp"]}
                                    maxSizeMB={5}
                                />
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium ml-2">
                                Used as a placeholder while the video is buffering.
                            </p>
                        </div>

                        {/* Video Duration (Optional) */}
                        <div className="space-y-3">
                            <label htmlFor="video_duration" className="inline-flex items-center gap-2 text-sm font-black text-slate-700 ml-1">
                                <Clock className="w-4 h-4 text-slate-400" />
                                Runtime Duration
                            </label>
                            <div className="relative group">
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
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-100 transition-all text-sm font-black placeholder:text-slate-300"
                                    placeholder="Enter total seconds (e.g., 30)"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-slate-400 tracking-widest">Seconds</span>
                            </div>
                        </div>

                        {/* Active Toggle */}
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${formData.is_active ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
                                    {formData.is_active ? <CheckCircle2 className="w-6 h-6" /> : <X className="w-6 h-6" />}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-900 leading-none tracking-tight">Status: {formData.is_active ? 'Live' : 'Draft'}</p>
                                    <p className="text-[11px] text-slate-500 mt-1 font-medium">Control visibility on the homepage</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${formData.is_active ? 'bg-indigo-600' : 'bg-slate-300'}`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.is_active ? 'translate-x-5' : 'translate-x-0'}`}
                                />
                            </button>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 mt-8">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 text-sm font-black text-slate-500 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-2xl transition-all duration-300"
                                disabled={isSubmitting}
                            >
                                Discard
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || !formData.product_id || !formData.video_url}
                                className="group relative px-10 py-3.5 bg-slate-900 hover:bg-indigo-600 text-white text-sm font-black rounded-2xl shadow-xl shadow-slate-900/10 hover:shadow-indigo-500/20 transition-all duration-500 disabled:opacity-50 disabled:bg-slate-300 disabled:shadow-none overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            {collection ? 'Save Changes' : 'Publish Feature'}
                                            <Package className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
