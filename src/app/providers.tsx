"use client"

import { ReactNode } from "react"
import { usePathname } from "next/navigation"

import { CartSidebarProvider } from "@modules/layout/context/cart-sidebar-context"
import { LayoutDataProvider } from "@modules/layout/context/layout-data-context"
import { CartStoreProvider } from "@modules/cart/context/cart-store-context"
import { ToastProvider } from "@modules/common/context/toast-context"
import ToastDisplay from "@modules/common/components/toast-display"
import { ShippingPriceProvider } from "@modules/common/context/shipping-price-context"
import { WishlistProvider } from "@modules/products/context/wishlist"
import { ChatbotProvider, ChatbotWidget } from "@modules/chatbot"
import { PWAProvider } from "@modules/layout/components/pwa-install-prompt/PWAContext"

const Providers = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith("/admin")

  // Auth and wishlist data now fetched client-side by respective providers
  // This allows root layout to be static instead of forcing dynamic rendering
  return (
    <LayoutDataProvider>
      <ToastProvider>
        <ToastDisplay />
        <CartStoreProvider>
          <ShippingPriceProvider>
            <CartSidebarProvider>
              <WishlistProvider>
                <ChatbotProvider>
                  <PWAProvider>
                    <ChatbotWidget hideLauncher={true} />
                    {children}
                  </PWAProvider>
                </ChatbotProvider>
              </WishlistProvider>
            </CartSidebarProvider>
          </ShippingPriceProvider>
        </CartStoreProvider>
      </ToastProvider>
    </LayoutDataProvider>
  )
}

export default Providers

