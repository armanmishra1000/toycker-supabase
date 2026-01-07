"use server"

import { createClient } from "@/lib/supabase/server"
import { RewardWallet, RewardTransaction, RewardTransactionWithOrder } from "@/lib/supabase/types"
import { revalidateTag } from "next/cache"
import { cache } from "react"

/**
 * Get the current user's reward wallet.
 * Returns null if user is not logged in or not a club member.
 */
export const getRewardWallet = cache(async (): Promise<RewardWallet | null> => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Only club members have wallets
    const isClubMember = user.user_metadata?.is_club_member === true
    if (!isClubMember) return null

    const { data: wallet, error } = await supabase
        .from("reward_wallets")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()

    if (error) {
        console.error("Error fetching reward wallet:", error)
        return null
    }

    return wallet as RewardWallet | null
})

/**
 * Get transaction history for the current user's wallet.
 * Returns empty array if no wallet exists.
 */
export async function getRewardTransactions(): Promise<RewardTransactionWithOrder[]> {
    const wallet = await getRewardWallet()
    if (!wallet) return []

    const supabase = await createClient()

    // 1. Fetch transactions
    const { data: transactions, error: txError } = await supabase
        .from("reward_transactions")
        .select("*")
        .eq("wallet_id", wallet.id)
        .order("created_at", { ascending: false })

    console.log(`DEBUG: Found ${transactions?.length || 0} transactions for wallet: ${wallet.id}`)

    if (txError) {
        console.error("DEBUG: Error fetching reward transactions:", {
            message: txError.message,
            details: txError.details,
            hint: txError.hint,
            code: txError.code
        })
        return []
    }

    if (!transactions || transactions.length === 0) return []

    // 2. Collect unique order IDs
    const orderIds = Array.from(new Set(
        transactions
            .filter(tx => tx.order_id)
            .map(tx => tx.order_id)
    ))

    // 3. Fetch order display IDs
    let ordersMap: Record<string, number> = {}
    if (orderIds.length > 0) {
        const { data: orders, error: orderError } = await supabase
            .from("orders")
            .select("id, display_id")
            .in("id", orderIds)

        if (orderError) {
            console.error("Error fetching order details for rewards:", orderError)
        } else if (orders) {
            ordersMap = orders.reduce((acc, order) => {
                acc[order.id] = order.display_id
                return acc
            }, {} as Record<string, number>)
        }
    }

    // 4. Map display IDs back to transactions
    return transactions.map(tx => ({
        ...tx,
        orders: tx.order_id && ordersMap[tx.order_id]
            ? { display_id: ordersMap[tx.order_id] }
            : null
    })) as RewardTransactionWithOrder[]
}

/**
 * Get or create a wallet for a user.
 * Used internally when crediting rewards.
 */
async function getOrCreateWallet(userId: string): Promise<RewardWallet | null> {
    const supabase = await createClient()

    // Try to get existing wallet
    const { data: existingWallet } = await supabase
        .from("reward_wallets")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle()

    if (existingWallet) {
        return existingWallet as RewardWallet
    }

    // Create new wallet
    const { data: newWallet, error } = await supabase
        .from("reward_wallets")
        .insert({ user_id: userId, balance: 0 })
        .select()
        .single()

    if (error) {
        console.error("Error creating reward wallet:", error)
        return null
    }

    return newWallet as RewardWallet
}

/**
 * Credit rewards to a user after a successful order.
 * Called from placeOrder in cart.ts
 */
export async function creditRewards(
    userId: string,
    orderId: string,
    orderTotal: number,
    rewardsPercentage: number
): Promise<number> {
    // Calculate points (1 point = ₹1, so percentage of total)
    const pointsEarned = Math.floor((orderTotal * rewardsPercentage) / 100)

    if (pointsEarned <= 0) return 0

    const wallet = await getOrCreateWallet(userId)
    if (!wallet) return 0

    const supabase = await createClient()

    // Update wallet balance
    const { error: updateError } = await supabase
        .from("reward_wallets")
        .update({
            balance: wallet.balance + pointsEarned,
            updated_at: new Date().toISOString()
        })
        .eq("id", wallet.id)

    if (updateError) {
        console.error("Error updating wallet balance:", updateError)
        return 0
    }

    // Record transaction
    const { error: txError } = await supabase
        .from("reward_transactions")
        .insert({
            wallet_id: wallet.id,
            amount: pointsEarned,
            type: "earned",
            description: `Earned from order`,
            order_id: orderId
        })

    if (txError) {
        console.error("DEBUG: Error recording reward transaction (EARNED):", {
            error: txError,
            wallet_id: wallet.id,
            order_id: orderId,
            userId
        })
    } else {
        console.log("DEBUG: Successfully recorded reward transaction (EARNED) for wallet:", wallet.id)
    }

    revalidateTag("rewards")
    return pointsEarned
}

/**
 * Deduct rewards when spending points at checkout.
 * Called from placeOrder in cart.ts
 */
export async function deductRewards(
    userId: string,
    orderId: string,
    points: number
): Promise<boolean> {
    if (points <= 0) return true

    const wallet = await getOrCreateWallet(userId)
    if (!wallet || wallet.balance < points) return false

    const supabase = await createClient()

    // Update wallet balance
    const { error: updateError } = await supabase
        .from("reward_wallets")
        .update({
            balance: wallet.balance - points,
            updated_at: new Date().toISOString()
        })
        .eq("id", wallet.id)

    if (updateError) {
        console.error("Error deducting from wallet:", updateError)
        return false
    }

    // Record transaction
    const { error: txError } = await supabase
        .from("reward_transactions")
        .insert({
            wallet_id: wallet.id,
            amount: -points,
            type: "spent",
            description: `Spent on order`,
            order_id: orderId
        })

    if (txError) {
        console.error("DEBUG: Error recording reward transaction (SPENT):", {
            error: txError,
            wallet_id: wallet.id,
            order_id: orderId,
            userId
        })
    } else {
        console.log("DEBUG: Successfully recorded reward transaction (SPENT) for wallet:", wallet.id)
    }

    revalidateTag("rewards")
    return true
}

/**
 * Set rewards to apply in the cart.
 * Stored in cart metadata for checkout.
 */
export async function setRewardsToApply(cartId: string, points: number): Promise<void> {
    const supabase = await createClient()

    // Get current cart metadata
    const { data: cart } = await supabase
        .from("carts")
        .select("metadata")
        .eq("id", cartId)
        .single()

    const currentMetadata = (cart?.metadata || {}) as Record<string, unknown>

    // Update metadata with rewards_to_apply
    const { error } = await supabase
        .from("carts")
        .update({
            metadata: {
                ...currentMetadata,
                rewards_to_apply: points
            },
            updated_at: new Date().toISOString()
        })
        .eq("id", cartId)

    if (error) {
        console.error("Error setting rewards to apply:", error)
        throw new Error("Failed to apply rewards")
    }

    revalidateTag("cart")
}

/**
 * Clear rewards from cart (when order is placed or user removes them).
 */
export async function clearRewardsFromCart(cartId: string): Promise<void> {
    const supabase = await createClient()

    const { data: cart } = await supabase
        .from("carts")
        .select("metadata")
        .eq("id", cartId)
        .single()

    const currentMetadata = (cart?.metadata || {}) as Record<string, unknown>

    // Remove rewards_to_apply from metadata
    const { rewards_to_apply, ...restMetadata } = currentMetadata as { rewards_to_apply?: number;[key: string]: unknown }

    const { error } = await supabase
        .from("carts")
        .update({
            metadata: restMetadata,
            updated_at: new Date().toISOString()
        })
        .eq("id", cartId)

    if (error) {
        console.error("Error clearing rewards from cart:", error)
    }

    revalidateTag("cart")
}
