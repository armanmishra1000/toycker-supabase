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

export async function deductClubSavingsFromOrder(orderId: string) {
    const adminSupabase = await createAdminClient()

    // 1. Fetch order to get club savings and user_id
    const { data: order, error: orderError } = await adminSupabase
        .from("orders")
        .select("user_id, metadata, items, total_amount, subtotal")
        .eq("id", orderId)
        .single()

    if (orderError || !order || !order.user_id) {
        console.error(`[CLUB] Order not found or no user associated for order ${orderId}:`, orderError)
        return
    }

    // Check if already deducted to avoid double-negative
    const metadata = (order.metadata || {}) as any
    if (metadata.club_savings_deducted) {
        return
    }

    // 2. Determine club savings to deduct
    let savingsToDeduct = 0
    if (metadata.club_savings_amount !== undefined) {
        savingsToDeduct = Number(metadata.club_savings_amount)
    } else if (metadata.club_savings !== undefined) {
        savingsToDeduct = Number(metadata.club_savings)
    } else if (metadata.club_discount_amount !== undefined) {
        savingsToDeduct = Number(metadata.club_discount_amount)
    } else {
        console.warn(`[CLUB] No club_savings in metadata for order ${orderId}. Using fallback calculation.`)

        const items = (order.items || []) as any[]
        let totalSavings = 0
        items.forEach(item => {
            const original = item.original_total || item.total || 0
            const current = item.total || 0
            if (original > current) {
                totalSavings += (original - current)
            }
        })
        savingsToDeduct = totalSavings
    }

    if (savingsToDeduct <= 0) {
        return
    }

    // 3. Update User Profile and Metadata
    const { data: { user }, error: userError } = await adminSupabase.auth.admin.getUserById(order.user_id)
    if (userError || !user) {
        console.error(`[CLUB] User not found for savings deduction (order ${orderId}):`, userError)
        return
    }

    const currentSavings = Number(user.user_metadata?.total_club_savings || 0)
    const newSavings = Math.max(0, currentSavings - savingsToDeduct)

    // Update Auth Metadata
    const { error: authError } = await adminSupabase.auth.admin.updateUserById(order.user_id, {
        user_metadata: {
            ...user.user_metadata,
            total_club_savings: newSavings
        }
    })
    if (authError) console.error(`[CLUB] Failed to update auth metadata for user ${order.user_id}:`, authError)

    // Update Profile Table
    const { error: profileError } = await adminSupabase.from("profiles").update({
        total_club_savings: newSavings
    }).eq("id", order.user_id)
    if (profileError) console.error(`[CLUB] Failed to update profiles table for user ${order.user_id}:`, profileError)

    // 4. Log the action in order metadata (to prevent double deduction and for audit)
    const { error: metadataError } = await adminSupabase.from("orders").update({
        metadata: {
            ...metadata,
            club_savings_deducted: true,
            deducted_amount: savingsToDeduct,
            deduction_date: new Date().toISOString()
        }
    }).eq("id", orderId)
    if (metadataError) console.error(`[CLUB] Failed to update order metadata for order ${orderId}:`, metadataError)

    return newSavings
}
