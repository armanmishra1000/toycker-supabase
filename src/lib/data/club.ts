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

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// ... existing imports

export async function checkAndActivateMembership(userId: string, orderTotal: number) {
    const settings = await getClubSettings()

    if (!settings.is_active) return false

    // Check if eligible
    if (orderTotal >= settings.min_purchase_amount) {
        // We need admin access to update user metadata for another user (or even current user securely)
        // Create a service role client
        const cookieStore = await cookies()

        // Fallback to anon key if service role is missing (will fail for admin ops but prevents crash if env is missing)
        // Ideally user MUST have SUPABASE_SERVICE_ROLE_KEY in .env
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            supabaseKey,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        // No-op for admin client usually, but good to have signature
                    },
                },
            }
        )

        // Check if already a member
        const { data: { user }, error } = await supabase.auth.admin.getUserById(userId)

        if (error || !user) {
            console.error("Failed to fetch user for membership check:", error)
            return false
        }

        const isMember = user?.user_metadata?.is_club_member

        if (!isMember) {
            await supabase.auth.admin.updateUserById(userId, {
                user_metadata: {
                    ...user.user_metadata,
                    is_club_member: true,
                    club_member_since: new Date().toISOString(),
                    total_club_savings: 0 // Initialize savings
                }
            })
            return true // Activated
        }
    }

    return false // Not activated (already member or not eligible)
}
