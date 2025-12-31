"use client"

import { Collection } from "@/lib/supabase/types"

interface CollectionCheckboxListProps {
    collections: Collection[]
    selectedIds: string[]
    name: string
}

export default function CollectionCheckboxList({
    collections,
    selectedIds,
    name
}: CollectionCheckboxListProps) {
    return (
        <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {collections.length === 0 ? (
                <p className="text-gray-400 text-xs italic">No collections available.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {collections.map(c => (
                        <label
                            key={c.id}
                            className="flex items-center gap-2.5 p-2 rounded-lg border border-gray-200 hover:border-gray-400 hover:bg-gray-50 cursor-pointer transition-all group"
                        >
                            <input
                                type="checkbox"
                                name={name}
                                value={c.id}
                                defaultChecked={selectedIds.includes(c.id)}
                                className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                            />
                            <span className="text-sm font-medium text-gray-700 group-hover:text-black line-clamp-1" title={c.title}>
                                {c.title}
                            </span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    )
}
