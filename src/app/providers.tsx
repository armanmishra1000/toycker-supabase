"use client"

import { ReactNode } from "react"

import { CartSidebarProvider } from "@modules/layout/context/cart-sidebar-context"
import { LayoutDataProvider } from "@modules/layout/context/layout-data-context"
import { CartStoreProvider } from "@modules/cart/context/cart-store-context"
import { ToastProvider } from "@modules/common/context/toast-context"
import { ShippingPriceProvider } from "@modules/common/context/shipping-price-context"

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <LayoutDataProvider>
      <ToastProvider>
        <CartStoreProvider>
          <ShippingPriceProvider>
            <CartSidebarProvider>{children}</CartSidebarProvider>
          </ShippingPriceProvider>
        </CartStoreProvider>
      </ToastProvider>
    </LayoutDataProvider>
  )
}

export default Providers
