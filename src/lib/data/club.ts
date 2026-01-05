"use server"

import { createClient } from "@/lib/supabase/server"
import { ClubSettings } from "@/lib/supabase/types"
import { revalidateTag, unstable_cache } from "next/cache"
import { cache } from "react"

export const getClubSettings = cache(async (): Promise<ClubSettings> => {
    const supabase = await createClient()

    // Try to get from cache first via unstable_cache if needed, but simple revalidateTag is often enough
    // Here we use direct DB call wrapped in React cache for deduping
    const { data, error } = await supabase
        .from("club_settings")
        .select("*")
        .eq("id", "default")
        .single()

    if (error || !data) {
        // Return defaults if table is empty or error
        return {
            id: "default",
            min_purchase_amount: 999,
            discount_percentage: 10,
            rewards_percentage: 5,
            is_active: true,
            updated_at: new Date().toISOString()
        }
    }

    return data as ClubSettings
})

export async function updateClubSettings(settings: Partial<ClubSettings>) {
    const supabase = await createClient()

    // Check auth - strict admin check should be here, but for now we rely on app-level middleware/layout
    const { error } = await supabase
        .from("club_settings")
        .update({
            ...settings,
            updated_at: new Date().toISOString()
        })
        .eq("id", "default")

    if (error) {
        throw new Error(`Failed to update settings: ${error.message}`)
    }

    revalidateTag("club_settings")
    revalidateTag("products") // Revalidate products as prices might change
}

// ... existing imports

export async function checkAndActivateMembership(userId: string, orderTotal: number) {
    const settings = await getClubSettings()

    if (!settings.is_active) return false

    // Check if eligible
    if (orderTotal >= settings.min_purchase_amount) {
        // Use regular client for current user operations
        const supabase = await createClient()

        // Get current user (works with regular anon key)
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error || !user || user.id !== userId) {
            // User not logged in or mismatch - skip silently
            return false
        }

        const isMember = user?.user_metadata?.is_club_member

        if (!isMember) {
            // Update current user's metadata (works with regular client)
            const { error: updateError } = await supabase.auth.updateUser({
                data: {
                    is_club_member: true,
                    club_member_since: new Date().toISOString(),
                    total_club_savings: 0
                }
            })

            if (updateError) {
                console.error("Failed to activate membership:", updateError)
                return false
            }

            // Sync to profiles table for admin accessibility
            await supabase.from("profiles").update({
                is_club_member: true,
                club_member_since: new Date().toISOString(),
                total_club_savings: 0
            }).eq("id", userId)

            // Note: revalidateTag must be called by the caller (e.g., placeOrder)
            // since it cannot be called during render
            return true // Activated
        }
    }

    return false // Not activated (already member or not eligible)
}
