"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { ExclusiveCollectionSchema, type ExclusiveCollectionFormData, type HomeExclusiveCollection } from "@/lib/types/home-exclusive-collections"
import { deleteFile, extractKeyFromUrl } from "./storage"

// =============================================
// List all collections (admin view)
// =============================================
export async function listExclusiveCollectionsAdmin() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("home_exclusive_collections")
        .select(`
      *,
      product:products (
        id,
        name,
        handle,
        image_url,
        images,
        price
      )
    `)
        .order("sort_order", { ascending: true })

    // Check for actual database errors (not empty result sets)
    if (error?.code || error?.details) {
        console.error("Error fetching exclusive collections:", error)
        return { collections: [] as HomeExclusiveCollection[], error: error.message || "Failed to fetch collections" }
    }

    // Success - return data (may be empty array)
    return { collections: (data || []) as HomeExclusiveCollection[], error: null }
}

// =============================================
// Create exclusive collection
// =============================================
export async function createExclusiveCollection(formData: ExclusiveCollectionFormData) {
    const supabase = await createClient()

    // Validate input
    const validatedData = ExclusiveCollectionSchema.safeParse(formData)
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
        poster_url: validatedData.data.poster_url || null,
        video_duration: validatedData.data.video_duration || null,
    }

    // Insert collection
    const { data, error } = await supabase
        .from("home_exclusive_collections")
        .insert({
            ...cleanData,
            created_by: user.id,
            updated_by: user.id,
        })
        .select(`
      *,
      product:products (
        id,
        name,
        handle,
        image_url,
        images,
        price
      )
    `)
        .single()

    if (error) {
        console.error("Error creating exclusive collection:", error)

        // Check for unique constraint violation
        if (error.code === "23505") {
            return { error: "This product is already in the exclusive collections" }
        }

        return { error: error.message }
    }

    // Revalidate home page cache
    revalidatePath("/")
    revalidatePath("/admin/home-settings")

    return { collection: data as HomeExclusiveCollection, error: null }
}

// =============================================
// Update exclusive collection
// =============================================
export async function updateExclusiveCollection(
    id: string,
    formData: Partial<ExclusiveCollectionFormData>
) {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: "Unauthorized" }
    }

    // Clean up data
    const cleanData: Record<string, unknown> = {}
    if (formData.product_id !== undefined) cleanData.product_id = formData.product_id
    if (formData.video_url !== undefined) cleanData.video_url = formData.video_url
    if (formData.poster_url !== undefined) cleanData.poster_url = formData.poster_url || null
    if (formData.video_duration !== undefined) cleanData.video_duration = formData.video_duration || null
    if (formData.sort_order !== undefined) cleanData.sort_order = formData.sort_order
    if (formData.is_active !== undefined) cleanData.is_active = formData.is_active

    const { data, error } = await supabase
        .from("home_exclusive_collections")
        .update({
            ...cleanData,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select(`
      *,
      product:products (
        id,
        name,
        handle,
        image_url,
        images,
        price
      )
    `)
        .single()

    if (error) {
        console.error("Error updating exclusive collection:", error)

        if (error.code === "23505") {
            return { error: "This product is already in the exclusive collections" }
        }

        return { error: error.message }
    }

    revalidatePath("/")
    revalidatePath("/admin/home-settings")

    return { collection: data as HomeExclusiveCollection, error: null }
}

// =============================================
// Delete exclusive collection
// =============================================
export async function deleteExclusiveCollection(id: string) {
    const supabase = await createClient()

    // 1. Get current collection to find the media URLs
    const { data: collection } = await supabase
        .from("home_exclusive_collections")
        .select("video_url, poster_url")
        .eq("id", id)
        .single()

    // 2. Delete from database
    const { error } = await supabase
        .from("home_exclusive_collections")
        .delete()
        .eq("id", id)

    if (error) {
        console.error("Error deleting exclusive collection:", error)
        return { error: error.message }
    }

    // 3. Delete files from R2
    if (collection) {
        // Delete video
        if (collection.video_url) {
            const videoKey = await extractKeyFromUrl(collection.video_url)
            if (videoKey) await deleteFile(videoKey)
        }

        // Delete poster image
        if (collection.poster_url) {
            const posterKey = await extractKeyFromUrl(collection.poster_url)
            if (posterKey) await deleteFile(posterKey)
        }
    }

    revalidatePath("/")
    revalidatePath("/admin/home-settings")

    return { success: true, error: null }
}

// =============================================
// Reorder exclusive collections (atomic operation)
// =============================================
export async function reorderExclusiveCollections(collectionIds: string[]) {
    const supabase = await createClient()

    // Use RPC for atomic transaction
    const { error } = await supabase.rpc("reorder_exclusive_collections", {
        collection_ids: collectionIds,
    })

    if (error) {
        console.error("Error reordering exclusive collections:", error)
        return { error: error.message }
    }

    revalidatePath("/")
    revalidatePath("/admin/home-settings")

    return { success: true, error: null }
}
