"use client"

import { useState } from "react"
import { getPermissionLabel } from "@/lib/permissions"

type ExpandablePermissionListProps = {
    permissions: string[]
    maxVisible?: number
}

export function ExpandablePermissionList({
    permissions,
    maxVisible = 6
}: ExpandablePermissionListProps) {
    const [expanded, setExpanded] = useState(false)

    const visiblePermissions = expanded ? permissions : permissions.slice(0, maxVisible)
    const remainingCount = permissions.length - maxVisible

    return (
        <div className="flex flex-wrap gap-1">
            {visiblePermissions.map((perm) => (
                <span
                    key={perm}
                    className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                >
                    {getPermissionLabel(perm)}
                </span>
            ))}
            {remainingCount > 0 && !expanded && (
                <button
                    onClick={() => setExpanded(true)}
                    className="text-[10px] font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded hover:bg-gray-200 hover:text-gray-700 transition-colors cursor-pointer"
                >
                    +{remainingCount} more
                </button>
            )}
            {expanded && permissions.length > maxVisible && (
                <button
                    onClick={() => setExpanded(false)}
                    className="text-[10px] font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded hover:bg-gray-200 hover:text-gray-700 transition-colors cursor-pointer"
                >
                    Show less
                </button>
            )}
        </div>
    )
}
