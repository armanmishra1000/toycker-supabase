"use client"

import { useState, useEffect } from "react"
import { X, Layout, Link as LinkIcon, Image as ImageIcon, CheckCircle2, AlertCircle } from "lucide-react"
import { createHomeBanner, updateHomeBanner } from "@/lib/actions/home-banners"
import { type HomeBanner, type BannerFormData } from "@/lib/types/home-banners"
import { useToast } from "@modules/common/context/toast-context"
import { useRouter } from "next/navigation"
import ImageUploader from "../../image-uploader"

type Props = {
    isOpen: boolean
    onClose: () => void
    onSuccess: (_banner: HomeBanner) => void
    banner?: HomeBanner | null
    defaultSortOrder?: number
}

export default function BannerFormModal({ isOpen, onClose, onSuccess, banner, defaultSortOrder }: Props) {
    const router = useRouter()
    const { showToast } = useToast()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState<Partial<BannerFormData>>({
        title: "",
        image_url: "",
        alt_text: "",
        link_url: "",
        sort_order: 0,
        is_active: true,
    })

    // Reset form when modal opens/closes or banner changes
    useEffect(() => {
        if (isOpen) {
            if (banner) {
                setFormData({
                    title: banner.title,
                    image_url: banner.image_url,
                    alt_text: banner.alt_text || "",
                    link_url: banner.link_url || "",
                    sort_order: banner.sort_order,
                    is_active: banner.is_active,
                })
            } else {
                setFormData({
                    title: "",
                    image_url: "",
                    alt_text: "",
                    link_url: "",
                    sort_order: defaultSortOrder || 0,
                    is_active: true,
                })
            }
        }
    }, [isOpen, banner, defaultSortOrder])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.title || !formData.image_url) {
            showToast("Title and image are required", "error")
            return
        }

        setIsSubmitting(true)

        try {
            const data: BannerFormData = {
                title: formData.title,
                image_url: formData.image_url,
                alt_text: formData.alt_text,
                link_url: formData.link_url || "",
                sort_order: formData.sort_order || 0,
                is_active: formData.is_active ?? true,
            }

            const result = banner
                ? await updateHomeBanner(banner.id, data)
                : await createHomeBanner(data)

            if (result.error) {
                showToast(result.error, "error")
            } else if (result.banner) {
                showToast(banner ? "Banner updated successfully" : "Banner created successfully", "success")
                onSuccess(result.banner)
                router.refresh()
                onClose()
            }
        } catch (error) {
            console.error("Error saving banner:", error)
            showToast("An unexpected error occurred", "error")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
                onClick={onClose}
            />

            <div className="flex min-h-screen items-center justify-center p-4">
                {/* Modal Container */}
                <div className="relative w-full max-w-2xl bg-white rounded-[28px] shadow-2xl shadow-gray-900/20 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">

                    {/* Decorative Header Background */}
                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-transparent pointer-events-none" />

                    {/* Header */}
                    <div className="relative flex items-center justify-between px-8 py-6 border-b border-gray-100">
                        <div>
                            <div className="flex items-center gap-2 text-emerald-600 mb-1">
                                <Layout className="w-4 h-4" />
                                <span className="text-[10px] font-bold tracking-widest uppercase">Visual Asset</span>
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                                {banner ? "Refine Banner" : "Create New Banner"}
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2.5 bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-300 group"
                        >
                            <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                        </button>
                    </div>

                    {/* Form Container */}
                    <form onSubmit={handleSubmit} className="relative p-8 space-y-8">

                        {/* Section 1: Identity */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="title" className="inline-flex items-center gap-2 text-sm font-bold text-gray-700 ml-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Internal Name
                                </label>
                                <input
                                    id="title"
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl ring-1 ring-gray-200 focus:ring-2 focus:ring-emerald-500 transition-all text-gray-900 placeholder:text-gray-400"
                                    placeholder="e.g., Winter Adventure Sale"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="alt_text" className="inline-flex items-center gap-2 text-sm font-bold text-gray-700 ml-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    SEO Description
                                </label>
                                <input
                                    id="alt_text"
                                    type="text"
                                    value={formData.alt_text}
                                    onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 placeholder:text-gray-400"
                                    placeholder="Describe for screen readers"
                                />
                            </div>
                        </div>

                        {/* Section 2: Media */}
                        <div className="space-y-3">
                            <label className="inline-flex items-center gap-2 text-sm font-bold text-gray-700 ml-1">
                                <ImageIcon className="w-4 h-4 text-emerald-500" />
                                Banner Graphic
                            </label>
                            <div className="rounded-3xl overflow-hidden ring-1 ring-gray-200 bg-gray-50/50 p-2">
                                <ImageUploader
                                    folder="banners"
                                    value={formData.image_url || ""}
                                    onChange={(url) => setFormData(prev => ({
                                        ...prev,
                                        image_url: url,
                                        // Auto-sync link URL if it's a new banner or link is currently empty
                                        link_url: (prev.link_url || !banner) ? url : prev.link_url
                                    }))}
                                    acceptedFormats={["image/jpeg", "image/png", "image/webp"]}
                                    maxSizeMB={5}
                                />
                            </div>
                        </div>

                        {/* Section 3: Interaction */}
                        <div className="space-y-3">
                            <label htmlFor="link_url" className="inline-flex items-center gap-2 text-sm font-bold text-gray-700 ml-1">
                                <LinkIcon className="w-4 h-4 text-emerald-500" />
                                Destination URL
                            </label>
                            <div className="relative group">
                                <input
                                    id="link_url"
                                    type="text"
                                    value={formData.link_url || ""}
                                    onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                                    className="w-full px-4 py-3 pl-11 bg-gray-50 border-none rounded-2xl ring-1 ring-gray-200 focus:ring-2 focus:ring-emerald-500 transition-all text-sm font-medium"
                                    placeholder="Paste URL or select product"
                                />
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                                    <CheckCircle2 className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="flex items-start gap-2 p-3 bg-emerald-50/30 rounded-xl border border-emerald-100/50">
                                <AlertCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                <p className="text-[11px] leading-relaxed text-emerald-800 font-medium">
                                    Pro-tip: By default, this points to your uploaded image. Replace it with a product page link to drive sales.
                                </p>
                            </div>
                        </div>

                        {/* Section 4: Visibility */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${formData.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-400'}`}>
                                    {formData.is_active ? <CheckCircle2 className="w-6 h-6" /> : <X className="w-6 h-6" />}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 leading-none">Status: {formData.is_active ? 'Active' : 'Draft'}</p>
                                    <p className="text-[11px] text-gray-500 mt-1">Control visibility on the storefront</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${formData.is_active ? 'bg-emerald-500' : 'bg-gray-200'}`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.is_active ? 'translate-x-5' : 'translate-x-0'}`}
                                />
                            </button>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-8">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-900 bg-white hover:bg-gray-50 rounded-2xl transition-all duration-300"
                                disabled={isSubmitting}
                            >
                                Discard
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || !formData.title || !formData.image_url}
                                className="group relative px-8 py-3 bg-gray-900 hover:bg-emerald-600 text-white text-sm font-bold rounded-2xl shadow-lg shadow-gray-900/10 hover:shadow-emerald-500/20 transition-all duration-500 disabled:opacity-50 disabled:bg-gray-300 disabled:shadow-none overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            {banner ? 'Save Changes' : 'Initialize Banner'}
                                            <Layout className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
