"use client"

import { convertToLocale } from "@lib/util/money"
import { Cart, Order } from "@/lib/supabase/types"
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
  order?: Order
}

const CartTotals: React.FC<CartTotalsProps> = ({
  totals,
  cart,
  order,
}) => {
  const {
    currency_code,
    total,
    tax_total,
  } = totals
  const normalizedCurrency = currency_code?.trim() || "INR"
  const { selectedShippingPrice } = useShippingPrice()

  // Handle both Cart and Order types for subtotal
  const itemSubtotal = totals.item_subtotal ?? (order?.subtotal ?? null) ?? cart?.item_subtotal ?? cart?.subtotal ?? 0

  // Handle shipping from multiple sources
  const getDisplayShippingSubtotal = (): number => {
    // First priority: Order's shipping_total
    if (order?.shipping_total !== undefined) {
      return order.shipping_total
    }

    // Second priority: If cart has shipping methods, try to get the total from the last shipping method
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

    // Third priority: shipping_subtotal from totals
    if (totals.shipping_subtotal && totals.shipping_subtotal > 0) {
      return totals.shipping_subtotal
    }

    // Fourth priority: Use the selected shipping price from context (for newly selected methods)
    if (selectedShippingPrice && selectedShippingPrice > 0) {
      return selectedShippingPrice
    }

    // Default to the provided shipping_subtotal (might be 0)
    return totals.shipping_subtotal ?? 0
  }

  const displayShippingSubtotal = getDisplayShippingSubtotal()

  // Handle discount from multiple sources
  const discountSubtotal = totals.discount_subtotal ?? order?.discount_total ?? cart?.discount_subtotal ?? 0

  // Get club savings from cart or order
  const club_savings = cart?.club_savings ?? 0
  const is_club_member = cart?.is_club_member ?? false
  const rewards_discount = cart?.rewards_discount ?? 0

  // Check if shipping is free
  const isFreeShipping = displayShippingSubtotal === 0

  return (
    <div className="space-y-4">
      {/* Club Member Savings Banner */}
      {is_club_member && club_savings > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2.5 text-green-700 mb-2">
            <span className="text-lg">🎉</span>
            <span className="font-bold text-sm">Toycker Club Savings!</span>
          </div>
          <div className="text-green-700 font-bold text-xl">
            You saved {convertToLocale({ amount: club_savings, currency_code: normalizedCurrency })}
          </div>
          <div className="text-green-600 text-xs mt-1.5">
            Thank you for being a valued club member
          </div>
        </div>
      )}

      {/* Pricing Rows */}
      <div className="space-y-3 text-sm text-slate-600">
        <div className="flex items-center justify-between">
          <span className="font-medium text-slate-600">Subtotal</span>
          <span className="font-semibold text-slate-900" data-testid="cart-subtotal" data-value={itemSubtotal}>
            {convertToLocale({ amount: itemSubtotal, currency_code: normalizedCurrency })}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span>Shipping</span>
          <span data-testid="cart-shipping" data-value={displayShippingSubtotal}>
            {displayShippingSubtotal === 0 && ((cart?.shipping_methods?.length ?? 0) > 0 || order?.shipping_total === 0) ? (
              <span className="text-green-600 font-semibold">Free Shipping</span>
            ) : (
              convertToLocale({ amount: displayShippingSubtotal, currency_code: normalizedCurrency })
            )}
          </span>
        </div>

        {discountSubtotal > 0 && (
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-600">Discount</span>
            <span
              className="font-semibold text-green-600"
              data-testid="cart-discount"
              data-value={discountSubtotal}
            >
              -{" "}
              {convertToLocale({
                amount: discountSubtotal,
                currency_code: normalizedCurrency,
              })}
            </span>
          </div>
        )}

        {rewards_discount > 0 && (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-medium text-slate-600">
              <span>🎁</span>
              <span>Rewards</span>
            </span>
            <span
              className="font-semibold text-purple-600"
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
          <span className="font-medium text-slate-600">Taxes</span>
          <span className="font-semibold text-slate-900" data-testid="cart-taxes" data-value={tax_total || 0}>
            {convertToLocale({ amount: tax_total ?? 0, currency_code: normalizedCurrency })}
          </span>
        </div>
      </div>

      {/* Total */}
      <div className="pt-4 mt-4 border-t-2 border-slate-200">
        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-slate-900">Total</span>
          <span
            className="text-2xl font-bold text-slate-900"
            data-testid="cart-total"
            data-value={total || 0}
          >
            {convertToLocale({ amount: total ?? 0, currency_code: normalizedCurrency })}
          </span>
        </div>
      </div>
    </div>
  )
}

export default CartTotals