"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { ReviewWithMedia } from "./reviews"

export type HomeReview = {
    id: string
    review_id: string
    sort_order: number
    created_at?: string
    review?: ReviewWithMedia
}

// =============================================
// List all featured reviews (admin view)
// =============================================
export async function listHomeReviewsAdmin() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("home_reviews")
        .select(`
            *,
            review:reviews (
                *,
                review_media (*)
            )
        `)
        .order("sort_order", { ascending: true })

    if (error) {
        console.error("Error fetching home reviews:", error)
        return { reviews: [] as HomeReview[], error: error.message }
    }

    // Fetch product names for these reviews
    const productIds = Array.from(new Set(data.map(hr => (Array.isArray(hr.review) ? hr.review[0] : hr.review)?.product_id).filter(Boolean)))

    const { data: products } = await supabase
        .from("products")
        .select("id, name")
        .in("id", productIds)

    const productMap = new Map(products?.map(p => [p.id, p.name]) || [])

    const reviewsWithProductNames = data.map(hr => {
        const review = (Array.isArray(hr.review) ? hr.review[0] : hr.review) as unknown as ReviewWithMedia
        if (review) {
            review.product_name = productMap.get(review.product_id) || "Unknown Product"
        }
        return {
            ...hr,
            review
        }
    })

    return { reviews: reviewsWithProductNames as HomeReview[], error: null }
}

// =============================================
// Fetch featured reviews for storefront
// =============================================
export async function listHomeReviewsStorefront() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("home_reviews")
        .select(`
            id,
            review_id,
            sort_order,
            review:reviews (
                id,
                rating,
                title,
                content,
                display_name,
                is_anonymous,
                product_id,
                review_media (*)
            )
        `)
        .order("sort_order", { ascending: true })
        .limit(12)

    if (error) {
        console.error("Error fetching storefront home reviews:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
        })
        return []
    }

    if (!data || data.length === 0) return []

    // Fetch product details for these reviews
    const productIds = Array.from(new Set(data.map(hr => (hr.review as any)?.product_id).filter(Boolean)))

    const { data: products } = await supabase
        .from("products")
        .select("id, name, price, image_url")
        .in("id", productIds)

    const productMap = new Map(products?.map(p => [p.id, p]) || [])

    // Merge product data into review objects
    const mergedData = data.map(hr => {
        const review = (Array.isArray(hr.review) ? hr.review[0] : hr.review) as unknown as ReviewWithMedia
        if (review && review.product_id) {
            const product = productMap.get(review.product_id) || null
            review.product = product
            review.product_name = product?.name || "Unknown Product"
        }
        return {
            ...hr,
            review: review
        }
    })

    return mergedData as unknown as HomeReview[]
}

// =============================================
// Add a review to home page
// =============================================
export async function addHomeReview(reviewId: string) {
    const supabase = await createClient()

    // 1. Check current count
    const { count } = await supabase
        .from("home_reviews")
        .select("*", { count: "exact", head: true })

    if (count && count >= 12) {
        return { error: "Maximum of 12 reviews can be added to the home page." }
    }

    // 2. Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Unauthorized" }

    // 3. Get next sort order
    const { data: maxOrderData } = await supabase
        .from("home_reviews")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle()

    const nextOrder = maxOrderData ? maxOrderData.sort_order + 1 : 0

    // 4. Add review
    const { data, error } = await supabase
        .from("home_reviews")
        .insert({
            review_id: reviewId,
            sort_order: nextOrder,
            created_by: user.id
        })
        .select()
        .single()

    if (error) {
        if (error.code === "23505") {
            return { error: "This review is already on the home page." }
        }
        return { error: error.message }
    }

    revalidatePath("/")
    revalidatePath("/admin/home-settings")

    return { review: data, error: null }
}

// =============================================
// Remove review from home page
// =============================================
export async function removeHomeReview(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from("home_reviews")
        .delete()
        .eq("id", id)

    if (error) return { error: error.message }

    revalidatePath("/")
    revalidatePath("/admin/home-settings")

    return { success: true, error: null }
}

// =============================================
// Reorder home reviews
// =============================================
export async function reorderHomeReviews(ids: string[]) {
    const supabase = await createClient()

    // Map each ID to its new order
    const updates = ids.map((id, index) =>
        supabase
            .from("home_reviews")
            .update({ sort_order: index })
            .eq("id", id)
    )

    const results = await Promise.all(updates)
    const error = results.find(r => r.error)?.error

    if (error) {
        console.error("Error reordering home reviews:", error)
        return { error: error.message }
    }

    revalidatePath("/")
    revalidatePath("/admin/home-settings")

    return { success: true, error: null }
}
