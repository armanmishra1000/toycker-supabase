"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidateTag } from "next/cache"

export async function getWishlistItems() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return []
    }

    const { data, error } = await supabase
        .from("wishlist_items")
        .select("product_id")
        .eq("user_id", user.id)

    if (error) {
        console.error("Error fetching wishlist items:", error)
        return []
    }

    return data.map((item) => item.product_id)
}

export async function addToWishlist(productId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("You must be logged in to add items to your wishlist")
    }

    const { error } = await supabase
        .from("wishlist_items")
        .insert({ user_id: user.id, product_id: productId })

    if (error) {
        if (error.code === '23505') {
            // Already in wishlist, ignore
            return
        }
        throw new Error(error.message)
    }

    revalidateTag("wishlist")
}

export async function removeFromWishlist(productId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("You must be logged in to remove items from your wishlist")
    }

    const { error } = await supabase
        .from("wishlist_items")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId)

    if (error) {
        throw new Error(error.message)
    }

    revalidateTag("wishlist")
}
