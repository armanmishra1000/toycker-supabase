"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import { Permission, hasPermission, hasAnyPermission, hasAllPermissions } from "./index"
import type { AdminRole } from "@/lib/supabase/types"

interface PermissionsContextType {
    permissions: string[]
    isLoading: boolean
    hasPermission: (permission: Permission) => boolean
    hasAnyPermission: (permissions: Permission[]) => boolean
    hasAllPermissions: (permissions: Permission[]) => boolean
    refresh: () => Promise<void>
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined)

interface PermissionsProviderProps {
    children: ReactNode
    initialPermissions?: string[]
}

export function PermissionsProvider({ children, initialPermissions = [] }: PermissionsProviderProps) {
    const [permissions, setPermissions] = useState<string[]>(initialPermissions)
    const [isLoading, setIsLoading] = useState(!initialPermissions.length)

    const fetchPermissions = async () => {
        try {
            setIsLoading(true)
            const supabase = createClient()

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setPermissions([])
                return
            }

            const { data: profile } = await supabase
                .from("profiles")
                .select(`
          admin_role_id,
          admin_role:admin_roles(permissions)
        `)
                .eq("id", user.id)
                .single()

            if (!profile?.admin_role) {
                setPermissions([])
                return
            }

            // Handle both array and single object return types
            const role = Array.isArray(profile.admin_role)
                ? profile.admin_role[0]
                : profile.admin_role as AdminRole

            setPermissions(role?.permissions || [])
        } catch (error) {
            console.error("Error fetching permissions:", error)
            setPermissions([])
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        // Only fetch if no initial permissions provided
        if (!initialPermissions.length) {
            fetchPermissions()
        }
    }, [])

    const contextValue: PermissionsContextType = React.useMemo(() => ({
        permissions,
        isLoading,
        hasPermission: (permission: Permission) => hasPermission(permissions, permission),
        hasAnyPermission: (perms: Permission[]) => hasAnyPermission(permissions, perms),
        hasAllPermissions: (perms: Permission[]) => hasAllPermissions(permissions, perms),
        refresh: fetchPermissions,
    }), [permissions, isLoading])

    return (
        <PermissionsContext.Provider value={contextValue}>
            {children}
        </PermissionsContext.Provider>
    )
}

/**
 * Hook to access permissions context
 * Must be used within PermissionsProvider
 */
export function usePermissions() {
    const context = useContext(PermissionsContext)
    if (!context) {
        throw new Error("usePermissions must be used within PermissionsProvider")
    }
    return context
}

/**
 * Hook to check a single permission
 * Returns boolean indicating if user has permission
 */
export function useHasPermission(permission: Permission): boolean {
    const { hasPermission } = usePermissions()
    return hasPermission(permission)
}

/**
 * Hook to check if user has any of the specified permissions
 */
export function useHasAnyPermission(permissions: Permission[]): boolean {
    const { hasAnyPermission } = usePermissions()
    return hasAnyPermission(permissions)
}

/**
 * Hook to check if user has all of the specified permissions
 */
export function useHasAllPermissions(permissions: Permission[]): boolean {
    const { hasAllPermissions } = usePermissions()
    return hasAllPermissions(permissions)
}
