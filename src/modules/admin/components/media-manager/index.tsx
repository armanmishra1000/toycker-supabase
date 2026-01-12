"use client"

import React, { useState, useCallback } from "react"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core"
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from "@dnd-kit/sortable"
import { Plus, Image as ImageIcon, Loader2 } from "lucide-react"
import { SortableItem } from "./sortable-item"
import { getPresignedUploadUrl } from "@/lib/actions/storage"
import { getFileUrl } from "@/lib/r2"
import { cn } from "@lib/util/cn"

interface MediaGalleryProps {
    initialImages?: string[]
    onOrderChange?: (_images: string[]) => void
}

export default function MediaGallery({ initialImages = [], onOrderChange }: MediaGalleryProps) {
    const [images, setImages] = useState<string[]>(initialImages)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)

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

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            setImages((items) => {
                const oldIndex = items.indexOf(active.id as string)
                const newIndex = items.indexOf(over.id as string)
                const newOrder = arrayMove(items, oldIndex, newIndex)
                onOrderChange?.(newOrder)
                return newOrder
            })
        }
    }, [onOrderChange])

    const handleRemove = useCallback((url: string) => {
        setImages((prev) => {
            const newImages = prev.filter((img) => img !== url)
            onOrderChange?.(newImages)
            return newImages
        })
    }, [onOrderChange])

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        setIsUploading(true)
        setUploadProgress(0)

        try {
            const uploadedUrls: string[] = []

            for (const file of files) {
                // Simple validation
                if (!file.type.startsWith("image/")) continue
                if (file.size > 5 * 1024 * 1024) continue

                const { url, key, error } = await getPresignedUploadUrl({
                    fileType: file.type,
                    folder: "products",
                })

                if (error || !url || !key) throw new Error(error || "Failed to get upload URL")

                const xhr = new XMLHttpRequest()

                // Wrap XHR in promise for async/await loop
                const uploadPromise = new Promise<string>((resolve, reject) => {
                    xhr.upload.addEventListener("progress", (ev) => {
                        if (ev.lengthComputable) {
                            setUploadProgress(Math.round((ev.loaded / ev.total) * 100))
                        }
                    })

                    xhr.addEventListener("load", () => {
                        if (xhr.status === 200) {
                            resolve(getFileUrl(key))
                        } else {
                            reject(new Error(`Upload failed for ${file.name}`))
                        }
                    })

                    xhr.addEventListener("error", () => reject(new Error("Network error")))
                    xhr.open("PUT", url)
                    xhr.setRequestHeader("Content-Type", file.type)
                    xhr.send(file)
                })

                const publicUrl = await uploadPromise
                uploadedUrls.push(publicUrl)
            }

            setImages((prev) => {
                const newImages = [...prev, ...uploadedUrls]
                onOrderChange?.(newImages)
                return newImages
            })
        } catch (error) {
            console.error("Upload error:", error)
            alert("Some files failed to upload. Please try again.")
        } finally {
            setIsUploading(false)
            setUploadProgress(0)
        }
    }

    return (
        <div className="space-y-4">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <SortableContext items={images} strategy={rectSortingStrategy}>
                        {images.map((url, index) => (
                            <SortableItem
                                key={url}
                                id={url}
                                url={url}
                                isPrimary={index === 0}
                                onRemove={handleRemove}
                            />
                        ))}
                    </SortableContext>

                    {/* Upload Placeholder */}
                    <label className={cn(
                        "relative aspect-square flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 hover:bg-white hover:border-black transition-all cursor-pointer group",
                        isUploading && "opacity-50 cursor-not-allowed pointer-events-none"
                    )}>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                            disabled={isUploading}
                        />

                        {isUploading ? (
                            <>
                                <Loader2 className="h-6 w-6 text-black animate-spin" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                    {uploadProgress}%
                                </span>
                            </>
                        ) : (
                            <>
                                <div className="p-2 bg-white rounded-lg border border-admin-border shadow-sm group-hover:scale-110 transition-transform">
                                    <Plus className="h-5 w-5 text-gray-400 group-hover:text-black" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-black">
                                    Add Media
                                </span>
                            </>
                        )}
                    </label>
                </div>
            </DndContext>

            {images.length === 0 && !isUploading && (
                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/30">
                    <ImageIcon className="h-8 w-8 text-gray-200 mb-2" />
                    <p className="text-sm text-gray-400 font-medium">No media assets yet</p>
                </div>
            )}

            {/* Hidden field to keep entire array in form data */}
            <input type="hidden" name="images_json" value={JSON.stringify(images)} />
            {/* Primary image field for backwards compatibility */}
            <input type="hidden" name="image_url" value={images[0] || ""} />
        </div>
    )
}
