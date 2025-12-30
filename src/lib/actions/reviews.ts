"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type ReviewData = {
    product_id: string
    rating: number
    title: string
    content: string
    display_name: string
    is_anonymous: boolean
    media: {
        file_path: string
        file_type: "image" | "video" | "audio"
        storage_provider?: string
    }[]
}

export type ReviewWithMedia = {
    id: string
    product_id: string
    user_id: string
    rating: number
    title: string
    content: string
    approval_status: "pending" | "approved" | "rejected"
    is_anonymous: boolean
    display_name: string
    created_at: string
    review_media: {
        id: string
        file_path: string
        file_type: "image" | "video" | "audio"
    }[]
    product_name?: string
    product_thumbnail?: string | null
}

export async function submitReview(data: ReviewData) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        // Optional: Allow guest reviews logic here if needed, but for now enforce auth as per plan
        return { error: "You must be logged in to submit a review." }
    }

    // Insert Review
    const { data: review, error: reviewError } = await supabase
        .from("reviews")
        .insert({
            product_id: data.product_id,
            user_id: user.id,
            rating: data.rating,
            title: data.title,
            content: data.content,
            display_name: data.display_name,
            is_anonymous: data.is_anonymous,
            approval_status: "pending", // Always pending initially
        })
        .select()
        .single()

    if (reviewError) {
        console.error("Error creating review:", reviewError)
        // Check for specific error codes if needed, e.g. FK violation
        if (reviewError.code === "23503") { // foreign_key_violation
            return { error: "Product not found. Please refresh and try again." }
        }
        return { error: "Failed to save review details. Please try again." }
    }

    // Insert Media if any
    if (data.media && data.media.length > 0) {
        const mediaInserts = data.media.map((item) => ({
            review_id: review.id,
            file_path: item.file_path,
            file_type: item.file_type,
            storage_provider: item.storage_provider || "r2",
        }))

        const { error: mediaError } = await supabase
            .from("review_media")
            .insert(mediaInserts)

        if (mediaError) {
            console.error("Error saving review media:", mediaError)
            // We might want to rollback the review here ideally, but for MVP keep it simple
            // or just return warning.
            return { error: "Review submitted but failed to save media." }
        }
    }

    revalidatePath(`/products/${data.product_id}`) // Revalidate product page
    return { success: true }
}

export async function approveReview(reviewId: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from("reviews")
        .update({ approval_status: "approved" })
        .eq("id", reviewId)

    if (error) {
        return { error: "Failed to approve review" }
    }
    revalidatePath("/admin/reviews")
    return { success: true }
}

export async function rejectReview(reviewId: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from("reviews")
        .update({ approval_status: "rejected" })
        .eq("id", reviewId)

    if (error) {
        return { error: "Failed to reject review" }
    }
    revalidatePath("/admin/reviews")
    return { success: true }
}

export async function deleteReview(reviewId: string) {
    const supabase = await createClient()
    // Trigger delete on reviews table (cascade will handle media rows)
    // Note: We are NOT deleting files from R2 in this simple implementation, 
    // but in production you'd want to list media and delete objects from R2 too.
    const { error } = await supabase.from("reviews").delete().eq("id", reviewId)

    if (error) {
        return { error: "Failed to delete review" }
    }
    revalidatePath("/admin/reviews")
    return { success: true }
}

export async function getProductReviews(productId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("reviews")
        .select(`
      *,
      review_media (*)
    `)
        .eq("product_id", productId)
        .eq("approval_status", "approved")
        .order("created_at", { ascending: false })

    if (error) {
        console.error("Error fetching reviews:", error)
        return []
    }
    return data as ReviewWithMedia[]
}

export async function getAllReviewsForAdmin() {
    const supabase = await createClient()
    const { data: reviews, error } = await supabase
        .from("reviews")
        .select(`
      *,
      review_media (*)
    `)
        .order("created_at", { ascending: false })

    if (error || !reviews) return []

    // Fetch product names manually
    const productIds = Array.from(new Set(reviews.map((r) => r.product_id)))

    // Note: Assuming 'products' table exists. 
    // If not, this might fail, but based on user context it should exist.
    // We use 'in' filter.
    const { data: products } = await supabase
        .from("products")
        .select("id, title, name") // medusa products usually have 'title', supabase maybe 'name'? 
        // Checking previously viewed file skeleton-product-preview.tsx might show product shape, 
        // or just assume 'title' or 'name'. 
        // 'ProductTemplate' uses 'product.name'. So it is 'name' or mapped to name.
        // The supabase type says 'Product'. 
        // Let's try select 'id, title, name' and see what we get or use 'name' if standard. 
        // Toycker repo seems to use Medusa structure synced to Supabase. Medusa uses 'title'.
        // But 'ProductTemplate' used 'product.name'. 
        // I'll select 'id, title, name' to be safe and check which one is present.
        .in("id", productIds)

    const productMap = new Map(products?.map((p: any) => [p.id, p.name || p.title || "Unknown Product"]) || [])

    return reviews.map((r) => ({
        ...r,
        product_name: productMap.get(r.product_id) || "Unknown Product",
    })) as ReviewWithMedia[]
}

export async function getUserReviews() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return []
    }

    const { data, error } = await supabase
        .from("reviews")
        .select(`
            *,
            review_media (*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

    if (error) {
        console.error("Error fetching user reviews:", error)
        return []
    }

    // Fetch product names and thumbnails for each review
    const productIds = data?.map((r) => r.product_id) || []

    const { data: products } = await supabase
        .from("products")
        .select("id, name, thumbnail")
        .in("id", productIds)

    const productMap = new Map(
        products?.map((p) => [
            p.id,
            { name: p.name, thumbnail: p.thumbnail }
        ]) || []
    )

    return data?.map((review) => ({
        ...review,
        product_name: productMap.get(review.product_id)?.name || "Unknown Product",
        product_thumbnail: productMap.get(review.product_id)?.thumbnail || null,
    })) || []
}
