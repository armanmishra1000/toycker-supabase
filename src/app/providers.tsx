"use client"

import { ReactNode } from "react"

import { CartSidebarProvider } from "@modules/layout/context/cart-sidebar-context"
import { LayoutDataProvider } from "@modules/layout/context/layout-data-context"
import { CartStoreProvider } from "@modules/cart/context/cart-store-context"
import { ToastProvider } from "@modules/common/context/toast-context"
import ToastDisplay from "@modules/common/components/toast-display"
import { ShippingPriceProvider } from "@modules/common/context/shipping-price-context"
import { WishlistProvider } from "@modules/products/context/wishlist"
import { ChatbotProvider, ChatbotWidget } from "@modules/chatbot"

const Providers = ({ children }: { children: ReactNode }) => {
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
                  {children}
                  <ChatbotWidget />
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

