"use client"

import { ReactNode } from "react"
import { useHasPermission } from "../context"
import type { Permission } from "../index"

interface PermissionTooltipProps {
    permission: Permission
    children: ReactNode
    message?: string
}

/**
 * Wraps children and shows tooltip when user lacks permission
 * Automatically disables interactive elements when permission is missing
 * 
 * @param permission - The permission required for the action
 * @param children - The component to wrap (usually a button or link)
 * @param message - Custom message to show in tooltip (default: generic message)
 * 
 * @example
 * <PermissionTooltip 
 *   permission={PERMISSIONS.PRODUCTS_DELETE}
 *   message="You need 'Delete Products' permission"
 * >
 *   <button onClick={deleteProduct}>Delete</button>
 * </PermissionTooltip>
 */
export function PermissionTooltip({
    permission,
    children,
    message = "You don't have permission to perform this action",
}: PermissionTooltipProps) {
    const hasPermission = useHasPermission(permission)

    if (hasPermission) {
        return <>{children}</>
    }

    return (
        <div className="relative group inline-block">
            <div className="pointer-events-none opacity-50">
                {children}
            </div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg">
                {message}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
        </div>
    )
}
