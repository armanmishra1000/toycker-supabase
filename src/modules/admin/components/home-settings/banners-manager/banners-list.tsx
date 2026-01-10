"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { deleteHomeBanner, updateHomeBanner, reorderHomeBanners } from "@/lib/actions/home-banners"
import { type HomeBanner } from "@/lib/types/home-banners"
import { useToast } from "@modules/common/context/toast-context"
import { useRouter } from "next/navigation"
import {
    Pencil,
    Trash2,
    Eye,
    EyeOff,
    GripVertical,
    ExternalLink,
    Hash,
    PictureInPicture,
    Copy,
    Check
} from "lucide-react"

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type Props = {
    banners: HomeBanner[]
    onEdit: (banner: HomeBanner) => void
    onDelete: (id: string) => void
    onToggle: (id: string, isActive: boolean) => void
    onReorder: (newBanners: HomeBanner[]) => void
}

interface SortableItemProps {
    banner: HomeBanner
    onEdit: (banner: HomeBanner) => void
    onDelete: (id: string, title: string) => void
    onToggle: (banner: HomeBanner) => void
    deletingId: string | null
    togglingId: string | null
}

function SortableBannerItem({ banner, onEdit, onDelete, onToggle, deletingId, togglingId }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: banner.id })

    const [copied, setCopied] = useState(false)

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.3 : 1,
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative bg-white rounded-2xl border transition-all duration-300 ${isDragging ? "shadow-2xl ring-2 ring-emerald-500/50" : "hover:shadow-xl hover:shadow-gray-200/50"
                } ${banner.is_active ? "border-gray-200" : "border-gray-200 bg-gray-50/50 opacity-80"
                }`}
        >
            <div className="flex flex-col lg:flex-row p-4 lg:p-5 gap-6">
                {/* Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="hidden lg:flex items-center justify-center text-gray-300 group-hover:text-gray-400 cursor-grab active:cursor-grabbing p-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                    <GripVertical className="w-5 h-5" />
                </div>

                {/* Banner Preview */}
                <div className="relative aspect-[21/9] lg:w-[320px] shrink-0 bg-gray-100 rounded-xl overflow-hidden shadow-inner border border-gray-200">
                    <Image
                        src={banner.image_url}
                        alt={banner.alt_text || banner.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 320px"
                    />
                    {!banner.is_active && (
                        <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px] flex items-center justify-center">
                            <span className="px-3 py-1 bg-white/90 rounded-full text-[10px] font-bold text-gray-900 uppercase tracking-widest shadow-sm">
                                Hidden
                            </span>
                        </div>
                    )}
                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded-md flex items-center gap-1.5 border border-white/10">
                        <Hash className="w-3 h-3 text-white/70" />
                        <span className="text-white text-[10px] font-bold">Order: {banner.sort_order}</span>
                    </div>
                </div>

                {/* Banner Info */}
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 truncate">
                                {banner.title}
                            </h3>
                            {banner.alt_text && (
                                <p className="text-sm text-gray-500 line-clamp-1 mt-0.5 italic">
                                    "{banner.alt_text}"
                                </p>
                            )}
                        </div>
                        <div className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-colors ${banner.is_active
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : "bg-gray-100 text-gray-500 border-gray-200"
                            }`}>
                            {banner.is_active ? "Active" : "Inactive"}
                        </div>
                    </div>

                    <div className="space-y-2 mt-auto">
                        {banner.link_url && (
                            <div className="flex items-center gap-2 p-2 bg-blue-50/50 rounded-lg border border-blue-100/50 group/link overflow-hidden transition-all hover:bg-blue-50">
                                <ExternalLink className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                <span className="text-[11px] text-blue-600 font-medium truncate flex-1">
                                    {banner.link_url}
                                </span>
                                <button
                                    onClick={() => copyToClipboard(banner.link_url!)}
                                    className="p-1.5 hover:bg-blue-100 rounded-md transition-colors text-blue-400 hover:text-blue-600"
                                    title="Copy Link"
                                >
                                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
                        <button
                            onClick={() => onToggle(banner)}
                            disabled={togglingId === banner.id}
                            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all ${banner.is_active
                                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200/50"
                                } disabled:opacity-50`}
                        >
                            {togglingId === banner.id ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : banner.is_active ? (
                                <>
                                    <EyeOff className="h-4 w-4" />
                                    <span>Hide</span>
                                </>
                            ) : (
                                <>
                                    <Eye className="h-4 w-4" />
                                    <span>Show</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => onEdit(banner)}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all"
                        >
                            <Pencil className="h-4 w-4" />
                            <span>Edit</span>
                        </button>

                        <button
                            onClick={() => onDelete(banner.id, banner.title)}
                            disabled={deletingId === banner.id}
                            className="flex-none inline-flex items-center justify-center w-10 h-10 text-red-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all border border-transparent hover:border-red-100"
                            title="Delete Banner"
                        >
                            {deletingId === banner.id ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function BannersList({ banners, onEdit, onDelete, onToggle, onReorder }: Props) {
    const router = useRouter()
    const { showToast } = useToast()
    const [isPending, startTransition] = useTransition()
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [togglingId, setTogglingId] = useState<string | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete "${title}"?`)) {
            return
        }

        setDeletingId(id)
        const result = await deleteHomeBanner(id)

        if (result.error) {
            showToast(result.error, "error")
        } else {
            showToast("Banner deleted successfully", "success")
            onDelete(id)
            router.refresh()
        }
        setDeletingId(null)
    }

    const handleToggleActive = async (banner: HomeBanner) => {
        setTogglingId(banner.id)
        const newStatus = !banner.is_active
        const result = await updateHomeBanner(banner.id, {
            is_active: newStatus,
        })

        if (result.error) {
            showToast(result.error, "error")
        } else {
            showToast(banner.is_active ? "Banner deactivated" : "Banner activated", "success")
            onToggle(banner.id, newStatus)
            router.refresh()
        }
        setTogglingId(null)
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event

        if (active.id !== over?.id) {
            const oldIndex = banners.findIndex((b) => b.id === active.id)
            const newIndex = banners.findIndex((b) => b.id === over?.id)

            const newOrder = arrayMove(banners, oldIndex, newIndex).map((b, i) => ({
                ...b,
                sort_order: i
            }))

            // Optimistically update parent state
            onReorder(newOrder)

            // Persist the new order
            const bannerIds = newOrder.map((b) => b.id)
            const result = await reorderHomeBanners(bannerIds)

            if (result.error) {
                showToast("Failed to save new order", "error")
                // Parent state will be re-synced on next fetch or manual revert if we wanted more complex logic
            } else {
                showToast("Order updated successfully", "success")
                router.refresh()
            }
        }
    }

    if (banners.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-4">
                    <PictureInPicture className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">No Banners Yet</h3>
                <p className="text-sm text-gray-500 max-w-xs text-center mt-1">
                    Your homepage currently has no promotional banners. Add one to capture customer attention!
                </p>
            </div>
        )
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={banners.map(b => b.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="grid grid-cols-1 gap-6">
                    {banners.map((banner) => (
                        <SortableBannerItem
                            key={banner.id}
                            banner={banner}
                            onEdit={onEdit}
                            onDelete={handleDelete}
                            onToggle={handleToggleActive}
                            deletingId={deletingId}
                            togglingId={togglingId}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    )
}
