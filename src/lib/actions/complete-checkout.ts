"use server"

import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

// Validation schema for checkout data
const AddressSchema = z.object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    address_1: z.string().min(1, "Address is required"),
    address_2: z.string().optional().nullable(),
    city: z.string().min(1, "City is required"),
    province: z.string().optional().nullable(),
    postal_code: z.string().min(1, "Postal code is required"),
    country_code: z.string().min(2, "Country is required"),
    phone: z.string().optional().nullable(),
})

const CheckoutSchema = z.object({
    cartId: z.string().min(1, "Cart ID is required"),
    email: z.string().email("Invalid email address"),
    shippingAddress: AddressSchema,
    billingAddress: AddressSchema,
    paymentMethod: z.string().min(1, "Payment method is required"),
    rewardsToApply: z.number().int().min(0).optional().default(0),
})

export type CheckoutData = z.infer<typeof CheckoutSchema>

export interface CheckoutResult {
    success: boolean
    orderId?: string
    paymentData?: any
    error?: string
}

export async function completeCheckout(
    data: CheckoutData
): Promise<CheckoutResult> {
    try {
        // Validate input data
        const validatedData = CheckoutSchema.parse(data)

        const supabase = await createClient()

        // Step 1: Initialize payment session (generates client secrets, PayU hashes, etc.)
        // This updates the cart in the DB with the necessary payment data
        const { initiatePaymentSession } = await import("@lib/data/cart")
        await initiatePaymentSession({ id: validatedData.cartId }, {
            provider_id: validatedData.paymentMethod
        })

        // Step 2: Call Supabase RPC function for atomic order creation
        // The RPC will now find the initialized payment session data in the cart record
        const { data: result, error } = await supabase.rpc(
            "create_order_with_payment",
            {
                p_cart_id: validatedData.cartId,
                p_email: validatedData.email,
                p_shipping_address: validatedData.shippingAddress,
                p_billing_address: validatedData.billingAddress,
                p_payment_provider: validatedData.paymentMethod,
                p_rewards_to_apply: validatedData.rewardsToApply,
            }
        )

        if (error) {
            console.error("Order creation error:", error)
            return {
                success: false,
                error: error.message || "Failed to create order. Please try again.",
            }
        }

        // Fetch the created order to get any updated payment data (like Stripe client_secret)
        const { data: orderData } = await supabase
            .from("orders")
            .select("*, payment_collection")
            .eq("id", result.order_id)
            .single()

        // Step 3: Handle post-order club and rewards logic
        // This was missing in the new atomic flow and is critical for club functionality
        const { retrieveCart, handlePostOrderLogic } = await import("@lib/data/cart")
        const currentCart = await retrieveCart() // To get club_savings info
        if (orderData && currentCart) {
            await handlePostOrderLogic(orderData, currentCart, validatedData.rewardsToApply)
        }

        // const { removeCartId } = await import("@lib/data/cart")
        // await removeCartId()
        // We will do redirect in the client to avoid issues with some actions
        // Cart clearing is handled by ClearCartOnMount on the confirmation page
        // to avoid "Not Found" race conditions during payment gateway handoffs.

        return {
            success: true,
            orderId: result.order_id,
            paymentData: orderData?.payment_collection?.payment_sessions?.find(
                (s: any) => s.provider_id === validatedData.paymentMethod
            )?.data
        }
    } catch (error) {
        console.error("Checkout error:", error)

        if (error instanceof z.ZodError) {
            const firstError = error.issues[0]
            return {
                success: false,
                error: firstError?.message || "Invalid checkout data",
            }
        }

        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred. Please try again.",
        }
    }
}
