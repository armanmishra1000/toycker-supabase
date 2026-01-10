"use client"

import { useCartStore } from "@modules/cart/context/cart-store-context"
import { useEffect } from "react"
import { removeCartId } from "@lib/data/cart"

export const ClearCartOnMount = () => {
    const { clearCart } = useCartStore()

    useEffect(() => {
        // Clear cart immediately when order confirmation page loads
        clearCart()
        removeCartId()
    }, [clearCart])

    return null
}
