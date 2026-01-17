"use client"

import React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { X, GripVertical } from "lucide-react"
import { cn } from "@lib/util/cn"

interface SortableItemProps {
    id: string
    url: string
    isPrimary?: boolean
    onRemove: (_id: string) => void
}

export function SortableItem({ id, url, isPrimary, onRemove }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "relative group aspect-square rounded-xl overflow-hidden border border-admin-border bg-gray-50 transition-all shadow-sm",
                isDragging && "opacity-50 scale-105 shadow-xl border-black ring-2 ring-black/10",
                !isDragging && "hover:border-gray-400 hover:shadow-md"
            )}
        >
            <img
                src={url}
                alt="Product"
                className="w-full h-full object-cover select-none"
                onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                        const fallback = document.createElement('div');
                        fallback.className = 'w-full h-full flex items-center justify-center bg-gray-50';
                        fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 text-gray-300"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                        parent.appendChild(fallback);
                    }
                }}
            />

            {/* Primary Badge */}
            {isPrimary && (
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black text-white text-[10px] font-bold uppercase tracking-wider rounded-md shadow-sm z-10">
                    Primary
                </div>
            )}

            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm border border-admin-border rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing hover:bg-white z-10"
            >
                <GripVertical className="h-4 w-4 text-gray-500" />
            </div>

            {/* Delete Button */}
            <button
                type="button"
                onClick={() => onRemove(id)}
                className="absolute bottom-2 right-2 p-1.5 bg-red-500/10 backdrop-blur-sm border border-red-200 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white z-10"
            >
                <X className="h-4 w-4" />
            </button>

            {/* Overlay on Drag */}
            {isDragging && (
                <div className="absolute inset-0 bg-black/5 pointer-events-none" />
            )}
        </div>
    )
}
