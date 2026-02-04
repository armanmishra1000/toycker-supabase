"use client"

import { useState, useMemo } from "react"
import { Search, Plus, Trash2, GripVertical, Star, User, Mic, Play, ArrowUpDown, Video, ImageIcon, Info } from "lucide-react"
import { type HomeReview, addHomeReview, removeHomeReview, reorderHomeReviews } from "@/lib/actions/home-reviews"
import { type ReviewWithMedia } from "@/lib/actions/reviews"
import { useToast } from "@modules/common/context/toast-context"
import { cn } from "@lib/util/cn"
import { useRouter } from "next/navigation"

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
    initialHomeReviews: HomeReview[]
    allApprovedReviews: ReviewWithMedia[]
}

type Props = {
    initialHomeReviews: HomeReview[]
    allApprovedReviews: ReviewWithMedia[]
}

interface SortableReviewItemProps {
    hr: HomeReview
    index: number
    onRemove: (id: string) => void
}

function SortableReviewItem({ hr, index, onRemove }: SortableReviewItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: hr.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.3 : 1,
    }

    const hasVideo = hr.review?.review_media?.some(m => m.file_type === 'video')
    const hasAudio = hr.review?.review_media?.some(m => m.file_type === 'audio')
    const isImageText = !hasVideo && !hasAudio

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "bg-white border border-gray-200 rounded-xl p-6 flex items-center gap-6 transition-all group",
                isDragging ? "shadow-2xl ring-2 ring-indigo-500/50" : "hover:shadow-xl hover:shadow-slate-200/50 hover:border-gray-200"
            )}
        >
            <div
                {...attributes}
                {...listeners}
                className="text-slate-200 group-hover:text-slate-300 transition-colors cursor-grab active:cursor-grabbing"
            >
                <GripVertical className="h-6 w-6" />
            </div>

            {/* Slot Number */}
            <div className="flex flex-col items-center justify-center h-12 w-12 rounded-lg bg-slate-50 border border-slate-100 shrink-0">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Slot</span>
                <span className="text-xl font-black text-slate-900 leading-none">{index + 1}</span>
            </div>

            {/* Review Preview */}
            <div className="flex-1 min-w-0 flex items-center gap-6">
                <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white ring-4 ring-indigo-50 shadow-sm font-black text-xl shrink-0">
                    {hr.review?.display_name?.[0]?.toUpperCase() || "A"}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                        <span className="text-lg font-black text-slate-900 truncate">{hr.review?.display_name || "Anonymous"}</span>
                        <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 rounded-lg shrink-0">
                            <Star className="h-3 w-3 text-amber-400 fill-current" />
                            <span className="text-xs font-black text-amber-700">{hr.review?.rating.toFixed(1)}</span>
                        </div>
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-1 italic mt-2 font-medium leading-relaxed">"{hr.review?.content}"</p>
                    <div className="flex items-center gap-4 mt-3">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.1em] bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100 truncate max-w-[150px]">
                            {hr.review?.product_name || hr.review?.product?.name || "Product Info"}
                        </span>
                        {hasAudio && (
                            <div className="flex items-center gap-1.5 text-indigo-500 shrink-0 bg-indigo-50/50 px-2 py-1 rounded-md">
                                <Mic className="h-3 w-3" />
                                <span className="text-[10px] font-black uppercase tracking-wider">Audio Review</span>
                            </div>
                        )}
                        {hasVideo && (
                            <div className="flex items-center gap-1.5 text-amber-500 shrink-0 bg-amber-50/50 px-2 py-1 rounded-md">
                                <Video className="h-3 w-3" />
                                <span className="text-[10px] font-black uppercase tracking-wider">Video Review</span>
                            </div>
                        )}
                        {isImageText && (
                            <div className="flex items-center gap-1.5 text-slate-500 shrink-0 bg-slate-50/50 px-2 py-1 rounded-md">
                                <ImageIcon className="h-3 w-3" />
                                <span className="text-[10px] font-black uppercase tracking-wider">Image/Text</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <button
                onClick={() => onRemove(hr.id)}
                className="p-3 rounded-2xl text-slate-300 hover:bg-rose-50 hover:text-rose-600 transition-all hover:scale-105 shrink-0"
                title="Remove from Home Page"
            >
                <Trash2 className="h-5 w-5" />
            </button>
        </div>
    )
}

export default function ReviewsManager({ initialHomeReviews, allApprovedReviews }: Props) {
    const router = useRouter()
    const { showToast } = useToast()
    const [homeReviews, setHomeReviews] = useState<HomeReview[]>(initialHomeReviews)
    const [searchQuery, setSearchQuery] = useState("")
    const [isAdding, setIsAdding] = useState(false)
    const [activeTab, setActiveTab] = useState<"suggested" | "audio" | "video" | "image_text">("suggested")

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

    const MAX_REVIEWS = 12
    const isLimitReached = homeReviews.length >= MAX_REVIEWS

    // Media requirement based on count (index-based)
    const mediaRequirement = useMemo(() => {
        const count = homeReviews.length
        if (count === 2) return "video" // Slot 3
        if (count === 3) return "audio" // Slot 4
        if (count >= 4) {
            // S5 (idx 4): Image/Text
            // S6 (idx 5): Video
            // S7 (idx 6): Image/Text
            // ... alternating properly
            return (count % 2 === 0) ? "image_or_text" : "video"
        }
        return null
    }, [homeReviews.length])

    // Filter out reviews already in homeReviews and apply media requirements or tab filters
    const availableReviews = useMemo(() => {
        const featuredIds = new Set(homeReviews.map(hr => hr.review_id))
        let filtered = allApprovedReviews.filter(r => !featuredIds.has(r.id))

        // Apply Tab / Media Requirement Filter
        if (activeTab === "suggested") {
            if (mediaRequirement) {
                filtered = filtered.filter(r => {
                    const hasVideo = r.review_media?.some(m => m.file_type === "video")
                    const hasAudio = r.review_media?.some(m => m.file_type === "audio")
                    if (mediaRequirement === "video") return hasVideo
                    if (mediaRequirement === "audio") return hasAudio
                    if (mediaRequirement === "image_or_text") return !hasVideo && !hasAudio
                    return true
                })
            }
        } else if (activeTab === "audio") {
            filtered = filtered.filter(r => r.review_media?.some(m => m.file_type === "audio"))
        } else if (activeTab === "video") {
            filtered = filtered.filter(r => r.review_media?.some(m => m.file_type === "video"))
        } else if (activeTab === "image_text") {
            filtered = filtered.filter(r => {
                const hasVideo = r.review_media?.some(m => m.file_type === "video")
                const hasAudio = r.review_media?.some(m => m.file_type === "audio")
                return !hasVideo && !hasAudio
            })
        }

        // Apply Search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            filtered = filtered.filter(r =>
                (r.display_name || "").toLowerCase().includes(q) ||
                (r.content || "").toLowerCase().includes(q) ||
                (r.product_name || "").toLowerCase().includes(q) ||
                (r.product?.name || "").toLowerCase().includes(q)
            )
        }

        return filtered.slice(0, 40) // Show top 40 results
    }, [allApprovedReviews, homeReviews, searchQuery, mediaRequirement, activeTab])

    const handleAdd = async (review: ReviewWithMedia) => {
        if (isLimitReached) {
            showToast(`Maximum of ${MAX_REVIEWS} reviews allowed.`, "error")
            return
        }

        setIsAdding(true)
        const result = await addHomeReview(review.id)
        setIsAdding(false)

        if (result.error) {
            showToast(result.error, "error")
        } else {
            showToast("Review added to home page", "success")
            setHomeReviews(prev => [...prev, { ...result.review!, review }])
            setSearchQuery("")
            // Switch to suggested tab for next slot
            setActiveTab("suggested")
        }
    }

    const handleRemove = async (id: string) => {
        const result = await removeHomeReview(id)
        if (result.error) {
            showToast(result.error, "error")
        } else {
            showToast("Review removed", "success")
            setHomeReviews(prev => prev.filter(r => r.id !== id))
            router.refresh()
        }
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event

        if (active.id !== over?.id) {
            const oldIndex = homeReviews.findIndex((hr) => hr.id === active.id)
            const newIndex = homeReviews.findIndex((hr) => hr.id === over?.id)

            const newOrder = arrayMove(homeReviews, oldIndex, newIndex).map((hr, i) => ({
                ...hr,
                sort_order: i
            }))

            // Optimistically update state
            setHomeReviews(newOrder)

            // Persist
            const ids = newOrder.map(hr => hr.id)
            const result = await reorderHomeReviews(ids)

            if (result.error) {
                showToast("Failed to save order", "error")
                // In a real app we'd revert state here
            } else {
                showToast("Order updated", "success")
                router.refresh()
            }
        }
    }

    return (
        <div className="space-y-8">
            {/* Header & Status Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">Featured Homepage Reviews</h3>
                    <p className="text-sm text-slate-500 mt-1 font-medium">
                        These reviews are prominently displayed on your store's homepage.
                    </p>
                </div>
                <div className="flex flex-col items-end">
                    <span className={cn(
                        "text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest",
                        isLimitReached ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700"
                    )}>
                        {homeReviews.length} / {MAX_REVIEWS} SET
                    </span>
                    {isLimitReached && (
                        <p className="text-[10px] text-amber-600 font-bold mt-2 uppercase tracking-tight">Maximum capacity reached</p>
                    )}
                </div>
            </div>

            {/* Selection Area (If not at limit) */}
            {!isLimitReached && (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-1 bg-indigo-600 rounded-full" />
                            <div>
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-[0.15em]">Select Approved Reviews</h4>
                                <div className="mt-2 space-y-1">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight italic">
                                        Following alternating pattern: Image/Text ↔ Video
                                    </p>
                                </div>
                            </div>
                        </div>

                        {mediaRequirement && activeTab === "suggested" && (
                            <div className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-2xl border animate-in fade-in slide-in-from-right-4 duration-500",
                                mediaRequirement === "video" && "bg-amber-50 border-amber-100 text-amber-700",
                                mediaRequirement === "audio" && "bg-indigo-50 border-indigo-100 text-indigo-700",
                                mediaRequirement === "image_or_text" && "bg-slate-50 border-slate-100 text-slate-700"
                            )}>
                                <Info className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                                    Slot {homeReviews.length + 1} Requirement: {mediaRequirement.replace(/_/g, " ")}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl overflow-hidden">
                        {/* Tabs */}
                        <div className="flex border-b border-gray-100 bg-slate-50/50">
                            <button
                                onClick={() => setActiveTab("suggested")}
                                className={cn(
                                    "flex-1 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all",
                                    activeTab === "suggested" ? "bg-white text-indigo-600 border-b-2 border-indigo-600" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                Recommended
                            </button>
                            <button
                                onClick={() => setActiveTab("image_text")}
                                className={cn(
                                    "flex-1 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all",
                                    activeTab === "image_text" ? "bg-white text-slate-900 border-b-2 border-slate-900" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                Image/Text
                            </button>
                            <button
                                onClick={() => setActiveTab("video")}
                                className={cn(
                                    "flex-1 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all",
                                    activeTab === "video" ? "bg-white text-amber-600 border-b-2 border-amber-600" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                Video
                            </button>
                            <button
                                onClick={() => setActiveTab("audio")}
                                className={cn(
                                    "flex-1 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all",
                                    activeTab === "audio" ? "bg-white text-rose-600 border-b-2 border-rose-600" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                Voice Only
                            </button>
                        </div>

                        <div className="p-6 lg:p-8">
                            <div className="relative mb-6">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder={activeTab === "suggested" && mediaRequirement
                                        ? `Showing only ${mediaRequirement.replace(/_/g, " ")} reviews...`
                                        : "Search by name, content, or product..."
                                    }
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium focus:border-black focus:ring-0 transition-all bg-gray-50/30 pl-12"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                                {availableReviews.map(review => {
                                    const hasVideo = review.review_media?.some(m => m.file_type === 'video')
                                    const hasAudio = review.review_media?.some(m => m.file_type === 'audio')
                                    const isImageText = !hasVideo && !hasAudio

                                    return (
                                        <div key={review.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-start gap-4 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50/50 transition-all duration-300 group">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs">
                                                        {review.display_name?.[0]?.toUpperCase() || "A"}
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-900 truncate">{review.display_name}</span>
                                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-lg">
                                                        <Star className="h-3 w-3 fill-current" />
                                                        <span className="text-[10px] font-black">{review.rating.toFixed(1)}</span>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-slate-500 line-clamp-2 italic leading-relaxed">"{review.content}"</p>
                                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                                    <span className="text-[10px] text-indigo-600 font-black uppercase tracking-wider bg-indigo-50 px-2 py-1 rounded-md max-w-[120px] truncate">
                                                        {review.product_name || review.product?.name || "Product Info"}
                                                    </span>
                                                    {hasVideo && (
                                                        <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                                                            <Video className="h-3 w-3" />
                                                            <span className="text-[9px] font-black">VIDEO</span>
                                                        </div>
                                                    )}
                                                    {hasAudio && (
                                                        <div className="flex items-center gap-1 text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                                                            <Mic className="h-3 w-3" />
                                                            <span className="text-[9px] font-black">VOICE</span>
                                                        </div>
                                                    )}
                                                    {isImageText && (
                                                        <div className="flex items-center gap-1 text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                                            <ImageIcon className="h-3 w-3" />
                                                            <span className="text-[9px] font-black">IMAGE/TEXT</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleAdd(review)}
                                                disabled={isAdding}
                                                className="mt-1 p-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
                                            >
                                                <Plus className="h-4 w-4 stroke-[3]" />
                                            </button>
                                        </div>
                                    )
                                })}
                                {availableReviews.length === 0 && (
                                    <div className="col-span-2 text-center py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-100">
                                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 mx-auto mb-4 flex items-center justify-center">
                                            <Info className="w-6 h-6 text-slate-300" />
                                        </div>
                                        <p className="text-sm text-slate-400 font-medium px-6">
                                            {searchQuery.trim()
                                                ? "No matching reviews found for your current search."
                                                : activeTab === "suggested" && mediaRequirement
                                                    ? `No more ${mediaRequirement.replace(/_/g, " ")} reviews available for Slot ${homeReviews.length + 1}.`
                                                    : "No more approved reviews available in this category."
                                            }
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* List of Featured Reviews */}
            <div className="space-y-6 pt-4">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-1 bg-slate-900 rounded-full" />
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-[0.15em]">Currently Displayed ({homeReviews.length})</h4>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={homeReviews.map(hr => hr.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {homeReviews.map((hr, idx) => (
                                <SortableReviewItem
                                    key={hr.id}
                                    hr={hr}
                                    index={idx}
                                    onRemove={handleRemove}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                    {homeReviews.length === 0 && (
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-16 text-center bg-slate-50/30">
                            <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-slate-100 mx-auto mb-6 flex items-center justify-center">
                                <User className="h-10 w-10 text-slate-200" />
                            </div>
                            <h5 className="text-lg font-black text-slate-400">No Featured Reviews</h5>
                            <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto font-medium">Add reviews from the selection area above to feature them on your homepage.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
