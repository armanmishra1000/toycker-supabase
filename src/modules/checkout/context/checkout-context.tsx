"use client"

import React, { createContext, useContext, ReactNode } from "react"
import {
  useCheckoutState,
  CheckoutState,
  Address,
} from "../hooks/useCheckoutState"
import { Cart } from "@/lib/supabase/types"

import { useCartStore } from "@modules/cart/context/cart-store-context"

interface CheckoutContextType {
  state: CheckoutState
  setEmail: (_email: string) => void
  setShippingAddress: (_address: Address) => void
  setBillingAddress: (_address: Address) => void
  setPaymentMethod: (_method: string) => void
  toggleSameAsBilling: () => void
  setSaveAddress: (_save: boolean) => void
  setRewardsToApply: (_points: number) => void
  reset: () => void
  isPaymentUpdating: boolean
}

export const CheckoutContext = createContext<CheckoutContextType | undefined>(
  undefined
)

export const CheckoutProvider = ({
  children,
  cart,
}: {
  children: ReactNode
  cart?: Cart | null
}) => {
  const [isPaymentUpdating, setIsPaymentUpdating] = React.useState(false)
  const { reloadFromServer } = useCartStore()
  // Initialize with cart data if available
  const initialData = cart
    ? {
        email: cart.email || null,
        shippingAddress: cart.shipping_address
          ? {
              first_name: cart.shipping_address.first_name || "",
              last_name: cart.shipping_address.last_name || "",
              address_1: cart.shipping_address.address_1 || "",
              address_2: cart.shipping_address.address_2,
              city: cart.shipping_address.city || "",
              province: cart.shipping_address.province,
              postal_code: cart.shipping_address.postal_code || "",
              country_code: cart.shipping_address.country_code || "IN",
              phone: cart.shipping_address.phone,
            }
          : null,
        billingAddress: cart.billing_address
          ? {
              first_name: cart.billing_address.first_name || "",
              last_name: cart.billing_address.last_name || "",
              address_1: cart.billing_address.address_1 || "",
              address_2: cart.billing_address.address_2,
              city: cart.billing_address.city || "",
              province: cart.billing_address.province,
              postal_code: cart.billing_address.postal_code || "",
              country_code: cart.billing_address.country_code || "IN",
              phone: cart.billing_address.phone,
            }
          : null,
        paymentMethod:
          cart.payment_collection?.payment_sessions?.find(
            (session) => session.status === "pending"
          )?.provider_id || null,
        rewardsToApply: cart.rewards_to_apply || 0,
      }
    : undefined

  const { setFromServer } = useCartStore()

  // Sync server-fetched cart to the global store on mount/change
  // This eliminates the delay when arriving from "Buy It Now"
  React.useEffect(() => {
    if (cart) {
      setFromServer(cart)
    }
  }, [cart, setFromServer])

  const checkout = useCheckoutState(initialData)

  // Eagerly persist payment method selection to trigger discount calculation
  const setPaymentMethod = async (method: string) => {
    checkout.setPaymentMethod(method)
    setIsPaymentUpdating(true)
    try {
      const { setPaymentProvider } = await import("@lib/data/cart")
      await setPaymentProvider(method)
      // Reload the cart store to fetch the new totals/discount from the server
      await reloadFromServer()
    } catch (error) {
      console.error("Failed to persist payment method:", error)
    } finally {
      setIsPaymentUpdating(false)
    }
  }

  return (
    <CheckoutContext.Provider
      value={{ ...checkout, setPaymentMethod, isPaymentUpdating }}
    >
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
