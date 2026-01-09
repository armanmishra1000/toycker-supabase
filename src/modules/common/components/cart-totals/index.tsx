"use client"

import { convertToLocale } from "@lib/util/money"
import { Cart, Order } from "@/lib/supabase/types"
import React from "react"
import { ShippingPriceContext } from "@modules/common/context/shipping-price-context"
import { CheckoutContext } from "@modules/checkout/context/checkout-context"

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
  const shippingPriceCtx = React.useContext(ShippingPriceContext)
  const checkoutCtx = React.useContext(CheckoutContext)

  const selectedShippingPrice = shippingPriceCtx?.selectedShippingPrice
  const rewards_discount = order ? (order.discount_total || 0) : (checkoutCtx?.state?.rewardsToApply || 0)

  // Handle both Cart and Order types for subtotal
  const itemSubtotal = totals.item_subtotal ?? (order?.subtotal ?? null) ?? cart?.item_subtotal ?? cart?.subtotal ?? 0

  // Handle shipping from multiple sources
  const getDisplayShippingSubtotal = (): number => {
    // 1. Order always wins
    if (order?.shipping_total !== undefined && order.shipping_total !== null) {
      return order.shipping_total
    }

    // 2. Check methods in cart
    if (cart?.shipping_methods && cart.shipping_methods.length > 0) {
      const method = cart.shipping_methods[cart.shipping_methods.length - 1]
      const baseAmount = Number(method.amount || method.total || method.subtotal || 0)
      const threshold = method.min_order_free_shipping

      if (threshold !== null && threshold !== undefined && itemSubtotal >= Number(threshold)) {
        return 0
      }
      return baseAmount
    }

    // 3. Fallback to top-level totals
    if (totals.shipping_subtotal && totals.shipping_subtotal > 0) {
      return totals.shipping_subtotal
    }

    // 4. Use the selected shipping price from context (for newly selected methods)
    if (selectedShippingPrice && selectedShippingPrice > 0) {
      return selectedShippingPrice
    }

    // Default to the provided shipping_subtotal (might be 0)
    return totals.shipping_subtotal ?? cart?.shipping_subtotal ?? 0
  }

  const displayShippingSubtotal = getDisplayShippingSubtotal()

  // Handle discount from multiple sources
  const discountSubtotal = totals.discount_subtotal ?? order?.discount_total ?? cart?.discount_subtotal ?? 0

  // Get club savings from cart or order
  const club_savings = cart?.club_savings ?? 0
  const is_club_member = cart?.is_club_member ?? false

  // Check if shipping is free
  const isFreeShipping = displayShippingSubtotal === 0

  // Calculate the base subtotal (before club discount)
  const baseSubtotal = itemSubtotal + club_savings

  return (
    <div className="flex flex-col text-slate-600 gap-y-3">
      <div className="space-y-3">
        <div className="flex items-center justify-between text-base">
          <span className="font-medium text-slate-500 uppercase tracking-tighter text-xs">Subtotal</span>
          <span className="font-bold text-slate-900" data-testid="cart-subtotal" data-value={baseSubtotal}>
            {convertToLocale({
              amount: baseSubtotal,
              currency_code: normalizedCurrency,
            })}
          </span>
        </div>

        {is_club_member && club_savings > 0 && (
          <div className="flex items-center justify-between bg-blue-50 px-4 py-3 rounded-2xl border border-blue-100 shadow-sm shadow-blue-900/5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-blue-800 text-sm">Club Savings</span>
              <span className="bg-blue-600 text-[10px] text-white px-1.5 py-0.5 rounded-full font-black uppercase">Member</span>
            </div>
            <span
              className="font-black text-blue-800"
              data-testid="cart-club-savings"
              data-value={club_savings}
            >
              -{" "}
              {convertToLocale({
                amount: club_savings,
                currency_code: normalizedCurrency,
              })}
            </span>
          </div>
        )}

        {rewards_discount > 0 && (
          <div className="flex items-center justify-between bg-emerald-50 px-4 py-3 rounded-2xl border border-emerald-100 shadow-sm shadow-emerald-900/5">
            <span className="font-bold text-emerald-800 text-sm">Reward Discount Applied</span>
            <span
              className="font-black text-emerald-800"
              data-testid="cart-discount"
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
          data-value={Math.max(0, itemSubtotal + displayShippingSubtotal + (tax_total || 0) - rewards_discount)}
        >
          {convertToLocale({
            amount: Math.max(0, itemSubtotal + displayShippingSubtotal + (tax_total || 0) - rewards_discount),
            currency_code: normalizedCurrency,
          })}
        </span>
      </div>
    </div>
  )
}

export default CartTotals