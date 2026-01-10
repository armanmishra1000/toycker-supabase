"use client"

import React, { createContext, useContext, ReactNode } from "react"
import { useCheckoutState, CheckoutState, Address } from "../hooks/useCheckoutState"
import { Cart } from "@/lib/supabase/types"

interface CheckoutContextType {
    state: CheckoutState
    setEmail: (email: string) => void
    setShippingAddress: (address: Address) => void
    setBillingAddress: (address: Address) => void
    setPaymentMethod: (method: string) => void
    toggleSameAsBilling: () => void
    setRewardsToApply: (points: number) => void
    reset: () => void
}

export const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined)

export const CheckoutProvider = ({
    children,
    cart
}: {
    children: ReactNode
    cart?: Cart | null
}) => {
    // Initialize with cart data if available
    const initialData = cart ? {
        email: cart.email || null,
        shippingAddress: cart.shipping_address ? {
            first_name: cart.shipping_address.first_name || "",
            last_name: cart.shipping_address.last_name || "",
            address_1: cart.shipping_address.address_1 || "",
            address_2: cart.shipping_address.address_2,
            city: cart.shipping_address.city || "",
            province: cart.shipping_address.province,
            postal_code: cart.shipping_address.postal_code || "",
            country_code: cart.shipping_address.country_code || "IN",
            phone: cart.shipping_address.phone,
        } : null,
        billingAddress: cart.billing_address ? {
            first_name: cart.billing_address.first_name || "",
            last_name: cart.billing_address.last_name || "",
            address_1: cart.billing_address.address_1 || "",
            address_2: cart.billing_address.address_2,
            city: cart.billing_address.city || "",
            province: cart.billing_address.province,
            postal_code: cart.billing_address.postal_code || "",
            country_code: cart.billing_address.country_code || "IN",
            phone: cart.billing_address.phone,
        } : null,
        paymentMethod: cart.payment_collection?.payment_sessions?.find(
            (session) => session.status === "pending"
        )?.provider_id || null,
        rewardsToApply: cart.rewards_to_apply || 0,
    } : undefined

    const checkout = useCheckoutState(initialData)

    return (
        <CheckoutContext.Provider value={checkout}>
            {children}
        </CheckoutContext.Provider>
    )
}

export const useCheckout = () => {
    const context = useContext(CheckoutContext)
    if (context === undefined) {
        throw new Error("useCheckout must be used within a CheckoutProvider")
    }
    return context
}
