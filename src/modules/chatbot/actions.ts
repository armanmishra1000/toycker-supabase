"use server"

/**
 * Chatbot Server Actions
 * API functions for chatbot to fetch data and authenticate users
 */

import { createClient } from "@/lib/supabase/server"
import { getAuthUser } from "@/lib/data/auth"
import { Order } from "@/lib/supabase/types"
import { getClubSettings } from "@/lib/data/club"
import { getRewardWallet } from "@/lib/data/rewards"
import { revalidatePath, revalidateTag } from "next/cache"

// Types for chatbot responses
export interface ChatbotUserInfo {
    isLoggedIn: boolean
    email?: string
    firstName?: string
    isClubMember?: boolean
    rewardBalance?: number
}

export interface ChatbotOrderInfo {
    found: boolean
    order?: {
        displayId: number
        status: string
        paymentStatus: string
        total: number
        createdAt: string
        trackingNumber?: string
        shippingPartner?: string
        itemCount: number
    }
    error?: string
}

export interface ChatbotClubInfo {
    isActive: boolean
    minPurchaseAmount: number
    discountPercentage: number
    rewardsPercentage: number
    isMember: boolean
    totalSavings?: number
}

export interface ChatbotLoginResult {
    success: boolean
    error?: string
    user?: {
        email: string
        firstName?: string
    }
}

/**
 * Get current user info for chatbot
 */
export async function getChatbotUserInfo(): Promise<ChatbotUserInfo> {
    const user = await getAuthUser()

    if (!user) {
        return { isLoggedIn: false }
    }

    const wallet = await getRewardWallet()

    return {
        isLoggedIn: true,
        email: user.email,
        firstName: user.user_metadata?.first_name || undefined,
        isClubMember: user.user_metadata?.is_club_member === true,
        rewardBalance: wallet?.balance || 0
    }
}

/**
 * Get club settings for chatbot
 */
export async function getChatbotClubInfo(): Promise<ChatbotClubInfo> {
    const user = await getAuthUser()
    const settings = await getClubSettings()

    return {
        isActive: settings.is_active,
        minPurchaseAmount: settings.min_purchase_amount,
        discountPercentage: settings.discount_percentage,
        rewardsPercentage: settings.rewards_percentage,
        isMember: user?.user_metadata?.is_club_member === true,
        totalSavings: user?.user_metadata?.total_club_savings || 0
    }
}

/**
 * Get user's orders for chatbot
 */
export async function getChatbotUserOrders(): Promise<{
    isLoggedIn: boolean
    orders: Array<{
        displayId: number
        status: string
        total: number
        createdAt: string
    }>
}> {
    const user = await getAuthUser()

    if (!user) {
        return { isLoggedIn: false, orders: [] }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
        .from("orders")
        .select("display_id, status, total_amount, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5)

    if (error) {
        console.error("Error fetching orders for chatbot:", error)
        return { isLoggedIn: true, orders: [] }
    }

    return {
        isLoggedIn: true,
        orders: (data || []).map(order => ({
            displayId: order.display_id,
            status: order.status,
            total: order.total_amount,
            createdAt: order.created_at
        }))
    }
}

/**
 * Lookup order by display ID for chatbot
 */
export async function lookupOrderByDisplayId(displayId: number): Promise<ChatbotOrderInfo> {
    const user = await getAuthUser()
    const supabase = await createClient()

    // Build query
    let query = supabase
        .from("orders")
        .select("*, shipping_partner:shipping_partners(name)")
        .eq("display_id", displayId)

    // If user is logged in, only show their orders
    if (user) {
        query = query.eq("user_id", user.id)
    }

    const { data: order, error } = await query.maybeSingle()

    if (error) {
        console.error("Error looking up order:", error)
        return { found: false, error: "Could not look up order. Please try again." }
    }

    if (!order) {
        // If user is logged in, the order might exist but belong to someone else
        if (user) {
            return {
                found: false,
                error: `Order #${displayId} was not found in your account. Please check the order number.`
            }
        }
        return {
            found: false,
            error: `Order #${displayId} not found. Please log in to view your orders.`
        }
    }

    // Count items
    const items = order.items as Array<unknown> | null
    const itemCount = Array.isArray(items) ? items.length : 0

    // Get shipping partner name
    const shippingPartner = order.shipping_partner as { name: string } | null

    return {
        found: true,
        order: {
            displayId: order.display_id,
            status: order.status,
            paymentStatus: order.payment_status,
            total: order.total_amount,
            createdAt: order.created_at,
            trackingNumber: order.tracking_number || undefined,
            shippingPartner: shippingPartner?.name || undefined,
            itemCount
        }
    }
}

/**
 * Login user from chatbot
 */
export async function chatbotLogin(email: string, password: string): Promise<ChatbotLoginResult> {
    if (!email || !password) {
        return { success: false, error: "Email and password are required" }
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
    })

    if (error) {
        return { success: false, error: error.message }
    }

    if (!data.user) {
        return { success: false, error: "Login failed. Please try again." }
    }

    revalidatePath("/", "layout")
    revalidateTag("customers", "max")
    revalidateTag("cart", "max")

    return {
        success: true,
        user: {
            email: data.user.email || email,
            firstName: data.user.user_metadata?.first_name || undefined
        }
    }
}

