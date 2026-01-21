"use client"

import { Cart } from "@/lib/supabase/types"
import { Text } from "@modules/common/components/text"

import ItemsPreviewTemplate from "@modules/cart/templates/preview"
import DiscountCode from "@modules/checkout/components/discount-code"
import CartTotals from "@modules/common/components/cart-totals"
import { useCartStore } from "@modules/cart/context/cart-store-context"
import Review from "@modules/checkout/components/review"
import RewardsRedemption from "@modules/checkout/components/rewards-redemption"

const CheckoutSummary = ({
  cart: serverCart,
}: {
  cart: Cart
}) => {
  const { cart: clientCart } = useCartStore()

  // Prioritize serverCart during initial render to avoid "delay" when arriving from "Buy It Now"
  // If absolute consistency is needed, we prefer clientCart ONLY if it has items and matches basic ID
  const cart = (clientCart?.items && clientCart.items.length > 0) ? clientCart : serverCart

  return (
    <div className="sticky top-4 flex flex-col gap-3 sm:gap-4">
      {/* Cart Summary Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Header */}
        <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 sm:pb-4 border-b border-gray-100">
          <Text
            as="h2"
            weight="bold"
            className="text-xl sm:text-2xl text-gray-900"
          >
            Order Summary
          </Text>
        </div>

        {/* Rewards Section - Moved to top for better visibility */}
        <div className="px-5 sm:px-6 pt-4">
          <RewardsRedemption cart={cart} />
        </div>

        {/* Product List */}
        <div className="px-5 sm:px-6 py-4 sm:py-4">
          <ItemsPreviewTemplate cart={cart} />
        </div>

        {/* Pricing Section */}
        <div className="px-5 sm:px-6 py-4 sm:py-4 bg-gray-50/50 border-t border-gray-100">
          <CartTotals totals={cart} cart={cart} />
        </div>

        {/* Discount Section */}
        <div className="px-5 sm:px-6 py-4 sm:py-4 border-t border-gray-100">
          <DiscountCode cart={cart} />
        </div>
      </div>

      {/* Complete Order Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 sm:pb-4">
          <Text
            as="h2"
            weight="bold"
            className="text-xl sm:text-2xl text-gray-900 mb-3 sm:mb-4"
          >
            Complete Order
          </Text>
          <Review cart={cart} />
        </div>
      </div>
    </div>
  )
}

export default CheckoutSummary