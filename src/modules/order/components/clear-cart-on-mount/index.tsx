"use client"

import { useCartStore } from "@modules/cart/context/cart-store-context"
import { useEffect } from "react"

export const ClearCartOnMount = () => {
    const { clearCart } = useCartStore()

    useEffect(() => {
        // Clear cart immediately when order confirmation page loads
        clearCart()
    }, [clearCart])

    return null
}
