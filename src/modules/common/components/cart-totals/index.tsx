"use client"

import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
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
  cart?: HttpTypes.StoreCart
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

  return (
    <div>
      <div className="flex flex-col gap-y-2 txt-medium text-ui-fg-subtle ">
        <div className="flex items-center justify-between">
          <span>Subtotal (excl. shipping and taxes)</span>
          <span data-testid="cart-subtotal" data-value={item_subtotal || 0}>
            {convertToLocale({ amount: item_subtotal ?? 0, currency_code: normalizedCurrency })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Shipping</span>
          <span data-testid="cart-shipping" data-value={displayShippingSubtotal}>
            {convertToLocale({ amount: displayShippingSubtotal, currency_code: normalizedCurrency })}
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
        <div className="flex justify-between">
          <span className="flex gap-x-1 items-center ">Taxes</span>
          <span data-testid="cart-taxes" data-value={tax_total || 0}>
            {convertToLocale({ amount: tax_total ?? 0, currency_code: normalizedCurrency })}
          </span>
        </div>
      </div>
      <div className="h-px w-full border-b border-gray-200 my-4" />
      <div className="flex items-center justify-between text-ui-fg-base mb-2 txt-medium ">
        <span>Total</span>
        <span
          className="txt-xlarge-plus"
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
