"use client"

import { useState, useTransition } from "react"
import { deleteExclusiveCollection, updateExclusiveCollection, reorderExclusiveCollections } from "@/lib/actions/home-exclusive-collections"
import { type HomeExclusiveCollection } from "@/lib/types/home-exclusive-collections"
import { useToast } from "@modules/common/context/toast-context"
import { useRouter } from "next/navigation"
import {
    Pencil,
    Trash2,
    Eye,
    EyeOff,
    Play,
    Clock,
    Tag,
    VideoIcon,
    GripVertical,
    Hash
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
    collections: HomeExclusiveCollection[]
    onEdit: (collection: HomeExclusiveCollection) => void
    onDelete: (id: string) => void
    onToggle: (id: string, isActive: boolean) => void
    onReorder: (newCollections: HomeExclusiveCollection[]) => void
}

interface SortableItemProps {
    collection: HomeExclusiveCollection
    onEdit: (collection: HomeExclusiveCollection) => void
    onDelete: (id: string, productName: string) => void
    onToggle: (collection: HomeExclusiveCollection) => void
    deletingId: string | null
    togglingId: string | null
}

function SortableCollectionItem({ collection, onEdit, onDelete, onToggle, deletingId, togglingId }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: collection.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.3 : 1,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative bg-white rounded-2xl border transition-all duration-300 ${isDragging ? "shadow-2xl ring-2 ring-emerald-500/50" : "hover:shadow-xl hover:shadow-gray-200/50"
                } flex flex-col ${collection.is_active ? "border-gray-200" : "border-gray-200 bg-gray-50/50 opacity-80"
                }`}
        >
            {/* Drag Handle Overlay */}
            <div
                {...attributes}
                {...listeners}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing bg-black/40 backdrop-blur-md p-1.5 rounded-full border border-white/20 text-white"
            >
                <GripVertical className="w-4 h-4" />
            </div>

            {/* Video Header Profile */}
            <div className="relative aspect-[9/12] w-full bg-gray-900 rounded-t-2xl overflow-hidden shadow-inner flex-shrink-0">
                <video
                    src={collection.video_url}
                    className="w-full h-full object-cover opacity-80"
                    muted
                    loop
                    playsInline
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-gray-900/30" />

                {/* Play Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 transform transition-transform group-hover:scale-110">
                        <Play className="w-6 h-6 text-white fill-white" />
                    </div>
                </div>

                {/* Status Badges */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                    <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border ${collection.is_active
                        ? "bg-emerald-500/80 text-white border-white/20"
                        : "bg-gray-500/80 text-white border-white/20"
                        }`}>
                        {collection.is_active ? "Live" : "Draft"}
                    </div>
                    {collection.video_duration && (
                        <div className="px-2 py-1 bg-black/50 backdrop-blur-md rounded-md flex items-center gap-1 border border-white/10">
                            <Clock className="w-3 h-3 text-white/70" />
                            <span className="text-white text-[10px] font-bold">
                                {Math.floor(collection.video_duration / 60)}:{String(collection.video_duration % 60).padStart(2, "0")}
                            </span>
                        </div>
                    )}
                </div>

                {/* Bottom Info Overlay */}
                <div className="absolute p-4 left-4 right-4 bottom-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Tag className="w-3 h-3 text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-tight">Featured Product</span>
                    </div>
                    <h3 className="text-lg font-bold text-white leading-tight line-clamp-2">
                        {collection.product?.name || "Unknown Product"}
                    </h3>
                </div>
            </div>

            {/* Content & Actions */}
            <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-6 font-medium">
                    <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                        <Hash className="w-3 h-3 text-gray-400" />
                        Order: {collection.sort_order}
                    </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-auto">
                    <button
                        onClick={() => onToggle(collection)}
                        disabled={togglingId === collection.id}
                        className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all ${collection.is_active
                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200/50"
                            } disabled:opacity-50`}
                    >
                        {togglingId === collection.id ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : collection.is_active ? (
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
                        onClick={() => onEdit(collection)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all"
                    >
                        <Pencil className="h-4 w-4" />
                        <span>Edit</span>
                    </button>

                    <button
                        onClick={() => onDelete(collection.id, collection.product?.name || "Collection")}
                        disabled={deletingId === collection.id}
                        className="flex-none inline-flex items-center justify-center w-11 h-11 text-red-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all border border-transparent hover:border-red-100"
                        title="Remove Collection"
                    >
                        {deletingId === collection.id ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Trash2 className="h-4 w-4" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function CollectionsList({ collections, onEdit, onDelete, onToggle, onReorder }: Props) {
    const router = useRouter()
    const { showToast } = useToast()
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

    const handleDelete = async (id: string, productName: string) => {
        if (!confirm(`Are you sure you want to delete the collection for "${productName}"?`)) {
            return
        }

        setDeletingId(id)
        const result = await deleteExclusiveCollection(id)

        if (result.error) {
            showToast(result.error, "error")
        } else {
            showToast("Collection deleted successfully", "success")
            onDelete(id)
            router.refresh()
        }
        setDeletingId(null)
    }

    const handleToggleActive = async (collection: HomeExclusiveCollection) => {
        setTogglingId(collection.id)
        const newStatus = !collection.is_active
        const result = await updateExclusiveCollection(collection.id, {
            is_active: newStatus,
        })

        if (result.error) {
            showToast(result.error, "error")
        } else {
            showToast(collection.is_active ? "Collection deactivated" : "Collection activated", "success")
            onToggle(collection.id, newStatus)
            router.refresh()
        }
        setTogglingId(null)
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event

        if (active.id !== over?.id) {
            const oldIndex = collections.findIndex((c) => c.id === active.id)
            const newIndex = collections.findIndex((c) => c.id === over?.id)

            const newOrder = arrayMove(collections, oldIndex, newIndex).map((c, i) => ({
                ...c,
                sort_order: i
            }))

            // Optimistically update parent state
            onReorder(newOrder)

            // Persist the new order
            const collectionIds = newOrder.map((c) => c.id)
            const result = await reorderExclusiveCollections(collectionIds)

            if (result.error) {
                showToast("Failed to save new order", "error")
            } else {
                showToast("Order updated successfully", "success")
                router.refresh()
            }
        }
    }

    if (collections.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-4">
                    <VideoIcon className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">No Collections Yet</h3>
                <p className="text-sm text-gray-500 max-w-xs text-center mt-1">
                    Spotlight your premium products with immersive video content on the homepage.
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
                items={collections.map(c => c.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {collections.map((collection) => (
                        <SortableCollectionItem
                            key={collection.id}
                            collection={collection}
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
