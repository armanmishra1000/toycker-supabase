"use client"

import { usePathname } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Home, User, LayoutGrid, Star, ShoppingBag } from "lucide-react"
import { useCartStore } from "@modules/cart/context/cart-store-context"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

function clx(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

const MobileNav = () => {
    const pathname = usePathname()
    const { cart } = useCartStore()

    // Calculate total quantity of items in cart
    const cartCount = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0

    const navItems = [
        {
            label: "Home",
            icon: Home,
            href: "/"
        },
        {
            label: "Account",
            icon: User,
            href: "/account"
        },
        {
            label: "Shop",
            icon: LayoutGrid,
            href: "/store"
        },
        {
            label: "Club",
            icon: Star,
            href: "/club"
        },
        {
            label: "Cart",
            icon: ShoppingBag,
            href: "/cart",
            badge: cartCount
        },
    ]

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-100 pb-safe shadow-[0_-8px_20px_-12px_rgba(0,0,0,0.15)] h-16">
            <div className="flex justify-around items-center h-full max-w-md mx-auto">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href

                    return (
                        <LocalizedClientLink
                            key={item.label}
                            href={item.href}
                            className={clx(
                                "flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-200 active:scale-95",
                                isActive ? "text-primary" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            <div className="relative">
                                <Icon
                                    className={clx(
                                        "w-6 h-6 transition-transform duration-200",
                                        isActive && "scale-110"
                                    )}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />

                                {item.badge !== undefined && item.badge > 0 && (
                                    <span className="absolute -top-1.5 -right-2 bg-primary text-white text-[10px] font-black min-w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-white px-1 shadow-sm">
                                        {item.badge > 99 ? "99+" : item.badge}
                                    </span>
                                )}

                                {isActive && (
                                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                                )}
                            </div>
                            <span className={clx(
                                "text-[10px] font-bold tracking-tight transition-colors duration-200",
                                isActive ? "text-primary" : "text-gray-500"
                            )}>
                                {item.label}
                            </span>
                        </LocalizedClientLink>
                    )
                })}
            </div>
        </div>
    )
}

export default MobileNav
