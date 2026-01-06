"use client"

import { useCartStore } from "@modules/cart/context/cart-store-context"

export const CartBadge = () => {
    const { cart } = useCartStore()
    const count = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0

    if (count === 0) return null

    return (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
            {count}
        </span>
    )
}
