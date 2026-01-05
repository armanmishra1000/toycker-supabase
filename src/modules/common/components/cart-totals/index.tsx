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
    <div className="flex flex-col text-slate-600 gap-y-3">
      <div className="space-y-3">
        <div className="flex items-center justify-between text-base">
          <span className="font-medium text-slate-500 uppercase tracking-tighter text-xs">Subtotal</span>
          <span className="font-bold text-slate-900" data-testid="cart-subtotal" data-value={itemSubtotal}>
            {convertToLocale({
              amount: itemSubtotal,
              currency_code: normalizedCurrency,
            })}
          </span>
        </div>

        {discountSubtotal > 0 && (
          <div className="flex items-center justify-between bg-emerald-50 px-4 py-3 rounded-2xl border border-emerald-100 shadow-sm shadow-emerald-900/5">
            <span className="font-bold text-emerald-800 text-sm">Reward Discount Applied</span>
            <span
              className="font-black text-emerald-800"
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

        <div className="flex items-center justify-between text-base">
          <span className="font-medium text-slate-500 uppercase tracking-tighter text-xs">Shipping</span>
          <span className="font-bold text-slate-900" data-testid="cart-shipping" data-value={displayShippingSubtotal}>
            {isFreeShipping ? (
              <span className="text-emerald-600 font-black">FREE</span>
            ) : (
              convertToLocale({
                amount: displayShippingSubtotal,
                currency_code: normalizedCurrency,
              })
            )}
          </span>
        </div>

        <div className="flex items-center justify-between text-base">
          <span className="font-medium text-slate-500 uppercase tracking-tighter text-xs">Taxes</span>
          <span className="font-bold text-slate-900" data-testid="cart-taxes" data-value={tax_total || 0}>
            {convertToLocale({
              amount: tax_total || 0,
              currency_code: normalizedCurrency,
            })}
          </span>
        </div>
      </div>

      <div className="my-6 border-t border-slate-200 border-dashed" />

      <div className="flex items-center justify-between px-2">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Final Total
          </span>
          <span className="text-[10px] text-slate-400 font-medium italic">
            Inclusive of all applicable taxes
          </span>
        </div>
        <span
          className="text-4xl font-black text-slate-900 tracking-tighter"
          data-testid="cart-total"
          data-value={total || 0}
        >
          {convertToLocale({
            amount: total || 0,
            currency_code: normalizedCurrency,
          })}
        </span>
      </div>
    </div>
  )
}

export default CartTotals