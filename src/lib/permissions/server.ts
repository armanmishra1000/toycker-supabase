"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Permission, hasPermission, hasAnyPermission, hasAllPermissions } from "./index"

/**
 * Get current user's permissions from their admin role
 * Cached per request by Next.js automatically
 */
export async function getUserPermissions(): Promise<string[]> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase
        .from("profiles")
        .select(`
      admin_role_id,
      admin_role:admin_roles(permissions)
    `)
        .eq("id", user.id)
        .single()

    if (!profile?.admin_role) return []

    // Handle both array and single object return types from Supabase
    const role = Array.isArray(profile.admin_role)
        ? profile.admin_role[0]
        : profile.admin_role

    return role?.permissions || []
}

/**
 * Check if current user has a specific permission
 * Returns false if user is not authenticated
 */
export async function checkPermission(required: Permission): Promise<boolean> {
    const permissions = await getUserPermissions()
    return hasPermission(permissions, required)
}

/**
 * Require permission or redirect to admin home
 * Throws redirect if user lacks permission
 * Use this to protect server actions
 */
export async function requirePermission(
    required: Permission,
    redirectTo: string = "/admin"
): Promise<void> {
    const hasAccess = await checkPermission(required)

    if (!hasAccess) {
        // Log unauthorized attempt for security auditing
        console.warn(`[RBAC] Unauthorized access attempt - Permission required: ${required}`)
        redirect(redirectTo)
    }
}

/**
 * Check if user has any of the specified permissions
 */
export async function checkAnyPermission(required: Permission[]): Promise<boolean> {
    const permissions = await getUserPermissions()
    return hasAnyPermission(permissions, required)
}

/**
 * Check if user has all of the specified permissions
 */
export async function checkAllPermissions(required: Permission[]): Promise<boolean> {
    const permissions = await getUserPermissions()
    return hasAllPermissions(permissions, required)
}
