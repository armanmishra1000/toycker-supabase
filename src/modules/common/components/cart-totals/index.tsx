"use client"

import { convertToLocale } from "@lib/util/money"
import { Cart } from "@/lib/supabase/types"
import React from "react"
import { useShippingPrice } from "@modules/common/context/shipping-price-context"

type CartTotalsProps = {
  totals: {
    total?: number | null
    subtotal?: number | null
    tax_total?: number | null
    currency_code: string
    item_subtotal?: number | null
    shipping_subtotal?: number | null
    discount_subtotal?: number | null
  }
  cart?: Cart
}

const CartTotals: React.FC<CartTotalsProps> = ({
  totals,
  cart
}) => {
  const {
    currency_code,
    total,
    tax_total,
    item_subtotal,
    shipping_subtotal,
    discount_subtotal,
  } = totals
  const normalizedCurrency = currency_code?.trim() || "INR"
  const { selectedShippingPrice } = useShippingPrice()

  // Calculate shipping subtotal from various sources
  const getDisplayShippingSubtotal = (): number => {
    // First priority: If cart has shipping methods, try to get the total from the last shipping method
    if (cart?.shipping_methods && cart.shipping_methods.length > 0) {
      const lastShippingMethod = cart.shipping_methods[cart.shipping_methods.length - 1]

      // Try to use the shipping method's total field (includes tax)
      if (lastShippingMethod.total && lastShippingMethod.total > 0) {
        return lastShippingMethod.total
      }

      // Try to use the shipping method's subtotal field (excludes tax)
      if (lastShippingMethod.subtotal && lastShippingMethod.subtotal > 0) {
        return lastShippingMethod.subtotal
      }
    }

    // Second priority: If shipping_subtotal is already set and non-zero, use it
    if (shipping_subtotal && shipping_subtotal > 0) {
      return shipping_subtotal
    }

    // Third priority: Use the selected shipping price from context (for newly selected methods)
    if (selectedShippingPrice && selectedShippingPrice > 0) {
      return selectedShippingPrice
    }

    // Default to the provided shipping_subtotal (might be 0)
    return shipping_subtotal ?? 0
  }

  const displayShippingSubtotal = getDisplayShippingSubtotal()

  // Get club savings from cart
  const club_savings = cart?.club_savings ?? 0
  const is_club_member = cart?.is_club_member ?? false
  const rewards_discount = cart?.rewards_discount ?? 0

  return (
    <div>
      {/* Club Member Savings Banner */}
      {is_club_member && club_savings > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-green-700">
            <span className="text-lg">🎉</span>
            <span className="font-semibold">Toycker Club Savings!</span>
          </div>
          <div className="text-green-600 font-bold text-lg">
            You saved {convertToLocale({ amount: club_savings, currency_code: normalizedCurrency })}
          </div>
          <div className="text-green-600 text-xs mt-1">
            Thank you for being a valued club member
          </div>
        </div>
      )}

      <div className="flex flex-col gap-y-2 text-base font-medium text-ui-fg-subtle ">

        <div className="flex items-center justify-between">
          <span>Subtotal (excl. shipping and taxes)</span>
          <span data-testid="cart-subtotal" data-value={item_subtotal || 0}>
            {convertToLocale({ amount: item_subtotal ?? 0, currency_code: normalizedCurrency })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Shipping</span>
          <span data-testid="cart-shipping" data-value={displayShippingSubtotal}>
            {displayShippingSubtotal === 0 && (cart?.shipping_methods?.length ?? 0) > 0 ? (
              <span className="text-green-600 font-semibold">Free Shipping</span>
            ) : (
              convertToLocale({ amount: displayShippingSubtotal, currency_code: normalizedCurrency })
            )}
          </span>
        </div>
        {!!discount_subtotal && (
          <div className="flex items-center justify-between">
            <span>Discount</span>
            <span
              className="text-ui-fg-interactive"
              data-testid="cart-discount"
              data-value={discount_subtotal || 0}
            >
              -{" "}
              {convertToLocale({
                amount: discount_subtotal ?? 0,
                currency_code: normalizedCurrency,
              })}
            </span>
          </div>
        )}
        {rewards_discount > 0 && (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <span>🎁</span>
              <span>Rewards Applied</span>
            </span>
            <span
              className="text-purple-600 font-semibold"
              data-testid="cart-rewards-discount"
              data-value={rewards_discount}
            >
              -{" "}
              {convertToLocale({
                amount: rewards_discount,
                currency_code: normalizedCurrency,
              })}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="flex gap-x-1 items-center ">Taxes</span>
          <span data-testid="cart-taxes" data-value={tax_total || 0}>
            {convertToLocale({ amount: tax_total ?? 0, currency_code: normalizedCurrency })}
          </span>
        </div>
      </div>
      <div className="h-px w-full border-b border-gray-200 my-4" />
      <div className="flex items-center justify-between text-ui-fg-base mb-2 text-base font-medium ">
        <span>Total</span>
        <span
          className="text-xl font-bold"
          data-testid="cart-total"
          data-value={total || 0}
        >
          {convertToLocale({ amount: total ?? 0, currency_code: normalizedCurrency })}
        </span>
      </div>
      <div className="h-px w-full border-b border-gray-200 mt-4" />
    </div>
  )
}

export default CartTotals