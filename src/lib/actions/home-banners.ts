"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { BannerSchema, type BannerFormData, type HomeBanner } from "@/lib/types/home-banners"
import { deleteFile, extractKeyFromUrl } from "./storage"

// =============================================
// List all banners (admin view)
// =============================================
export async function listHomeBannersAdmin() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("home_banners")
        .select("*")
        .order("sort_order", { ascending: true })

    if (error) {
        console.error("Error fetching banners:", error)
        return { banners: [] as HomeBanner[], error: error.message }
    }

    return { banners: data as HomeBanner[], error: null }
}

// =============================================
// Create banner
// =============================================
export async function createHomeBanner(formData: BannerFormData) {
    const supabase = await createClient()

    // Validate input
    const validatedData = BannerSchema.safeParse(formData)
    if (!validatedData.success) {
        return {
            error: "Invalid input data",
            details: validatedData.error.flatten().fieldErrors
        }
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: "Unauthorized" }
    }

    // Clean up data
    const cleanData = {
        ...validatedData.data,
        link_url: validatedData.data.link_url || null,
        alt_text: validatedData.data.alt_text || null,
        starts_at: validatedData.data.starts_at || null,
        ends_at: validatedData.data.ends_at || null,
    }

    // Insert banner
    const { data, error } = await supabase
        .from("home_banners")
        .insert({
            ...cleanData,
            created_by: user.id,
            updated_by: user.id,
        })
        .select()
        .single()

    if (error) {
        console.error("Error creating banner:", error)
        return { error: error.message }
    }

    // Revalidate home page cache
    revalidatePath("/")
    revalidatePath("/admin/home-settings")

    return { banner: data as HomeBanner, error: null }
}

// =============================================
// Update banner
// =============================================
export async function updateHomeBanner(id: string, formData: Partial<BannerFormData>) {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: "Unauthorized" }
    }

    // Clean up data
    const cleanData: Record<string, unknown> = {}
    if (formData.title !== undefined) cleanData.title = formData.title
    if (formData.image_url !== undefined) cleanData.image_url = formData.image_url
    if (formData.alt_text !== undefined) cleanData.alt_text = formData.alt_text || null
    if (formData.link_url !== undefined) cleanData.link_url = formData.link_url || null
    if (formData.sort_order !== undefined) cleanData.sort_order = formData.sort_order
    if (formData.is_active !== undefined) cleanData.is_active = formData.is_active
    if (formData.starts_at !== undefined) cleanData.starts_at = formData.starts_at || null
    if (formData.ends_at !== undefined) cleanData.ends_at = formData.ends_at || null

    const { data, error } = await supabase
        .from("home_banners")
        .update({
            ...cleanData,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

    if (error) {
        console.error("Error updating banner:", error)
        return { error: error.message }
    }

    revalidatePath("/")
    revalidatePath("/admin/home-settings")

    return { banner: data as HomeBanner, error: null }
}

// =============================================
// Delete banner
// =============================================
export async function deleteHomeBanner(id: string) {
    const supabase = await createClient()

    // 1. Get current banner to find the image URL
    const { data: banner } = await supabase
        .from("home_banners")
        .select("image_url")
        .eq("id", id)
        .single()

    // 2. Delete from database
    const { error } = await supabase
        .from("home_banners")
        .delete()
        .eq("id", id)

    if (error) {
        console.error("Error deleting banner:", error)
        return { error: error.message }
    }

    // 3. Delete from R2 if banner had an image URL
    if (banner?.image_url) {
        const key = await extractKeyFromUrl(banner.image_url)
        if (key) {
            await deleteFile(key)
        }
    }

    revalidatePath("/")
    revalidatePath("/admin/home-settings")

    return { success: true, error: null }
}

// =============================================
// Reorder banners (atomic operation)
// =============================================
export async function reorderHomeBanners(bannerIds: string[]) {
    const supabase = await createClient()

    // Use RPC for atomic transaction
    const { error } = await supabase.rpc("reorder_home_banners", {
        banner_ids: bannerIds,
    })

    if (error) {
        console.error("Error reordering banners:", error)
        return { error: error.message }
    }

    revalidatePath("/")
    revalidatePath("/admin/home-settings")

    return { success: true, error: null }
}
