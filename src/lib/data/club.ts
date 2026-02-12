"use server"

import { cache } from 'react'
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { ClubSettings } from "@/lib/supabase/types"
import { revalidateTag, unstable_cache } from "next/cache"

const getClubSettingsInternal = async (): Promise<ClubSettings> => {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("club_settings")
        .select("*")
        .eq("id", "default")
        .single()

    if (error || !data) {
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
}

// Wrap with React cache() for request-level deduplication
// Combined with unstable_cache for cross-request persistence
export const getClubSettings = cache(async () => {
    return await unstable_cache(
        getClubSettingsInternal,
        ["club-settings"],
        { revalidate: 3600, tags: ["club_settings"] }
    )()
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

    revalidateTag("club_settings", "max")
    revalidateTag("products", "max") // Revalidate products as prices might change
}

// ... existing imports

export async function checkAndActivateMembership(userId: string, orderTotal: number) {
    const settings = await getClubSettings()
    if (!settings.is_active) return false
    if (orderTotal < settings.min_purchase_amount) return false

    const adminSupabase = await createAdminClient()

    // Use admin API — works without user cookies (e.g. PayU server-to-server callback)
    const { data: { user }, error } = await adminSupabase.auth.admin.getUserById(userId)
    if (error || !user) return false

    if (user.user_metadata?.is_club_member) return false  // Already a member

    // Activate membership via admin API
    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(userId, {
        user_metadata: {
            ...user.user_metadata,
            is_club_member: true,
            club_member_since: new Date().toISOString(),
            total_club_savings: 0
        }
    })

    if (updateError) {
        console.error("Failed to activate membership:", updateError)
        return false
    }

    // Sync to profiles table for admin visibility
    await adminSupabase.from("profiles").update({
        is_club_member: true,
        club_member_since: new Date().toISOString(),
        total_club_savings: 0
    }).eq("id", userId)

    return true
}
