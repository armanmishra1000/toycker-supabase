"use client"

import { ReactNode } from "react"
import { useHasPermission } from "../context"
import type { Permission } from "../index"

interface ProtectedActionProps {
    permission: Permission
    children: ReactNode
    fallback?: ReactNode
    hideWhenDisabled?: boolean
}

/**
 * Component that conditionally renders children based on permission
 * Use this to wrap action buttons, links, or any UI that requires permission
 * 
 * @param permission - The permission required to show the children
 * @param children - The component(s) to render if permission is granted
 * @param fallback - Optional component to render if permission is denied (default: null)
 * @param hideWhenDisabled - If true, renders nothing instead of fallback when permission denied
 * 
 * @example
 * <ProtectedAction permission={PERMISSIONS.PRODUCTS_DELETE}>
 *   <button onClick={deleteProduct}>Delete</button>
 * </ProtectedAction>
 */
export function ProtectedAction({
    permission,
    children,
    fallback = null,
    hideWhenDisabled = false,
}: ProtectedActionProps) {
    const hasPermission = useHasPermission(permission)

    if (!hasPermission) {
        return hideWhenDisabled ? null : <>{fallback}</>
    }

    return <>{children}</>
}
