"use client"

import { Button } from "@modules/common/components/button"
import { Text } from "@modules/common/components/text"
import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import DiscountCode from "@modules/checkout/components/discount-code"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Cart } from "@/lib/supabase/types"
import { convertToLocale } from "@lib/util/money"
import { Package, ArrowRight } from "lucide-react"

type SummaryProps = {
  cart: Cart
}

const FREE_SHIPPING_THRESHOLD = 499 // INR

function getCheckoutStep(cart: Cart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  } else if (!cart.shipping_method) {
    return "delivery"
  } else {
    return "payment"
  }
}

const Summary = ({ cart }: SummaryProps) => {
  const step = getCheckoutStep(cart)
  const itemCount = cart.items?.length || 0
  const subtotal = cart.item_subtotal || cart.subtotal || 0
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)
  const hasFreeShipping = amountToFreeShipping === 0
  const progressPercentage = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)
  const currencyCode = cart.currency_code || "INR"

  // Rewards info for club members
  const availableRewards = cart.available_rewards || 0
  const isClubMember = cart.is_club_member || false

  return (
    <div className="flex flex-col gap-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Text as="h2" weight="bold" className="text-xl lg:text-2xl text-slate-900">
          Order Summary
        </Text>
        <span className="text-sm text-slate-500">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </span>
      </div>

      {/* Free Shipping Progress */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasFreeShipping ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
            <Package className="w-4 h-4" />
          </div>
          <div className="flex-1">
            {hasFreeShipping ? (
              <p className="text-sm font-semibold text-green-700">
                🎉 You've unlocked FREE shipping!
              </p>
            ) : (
              <p className="text-sm text-slate-700">
                Add <strong className="text-slate-900">{convertToLocale({ amount: amountToFreeShipping, currency_code: currencyCode })}</strong> more for free shipping
              </p>
            )}
          </div>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${hasFreeShipping ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Rewards Available Banner (Club Members) */}
      {isClubMember && availableRewards > 0 && (
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎁</span>
              <span className="text-sm font-medium text-purple-800">
                You have <strong>{availableRewards}</strong> reward points
              </span>
            </div>
            <span className="text-xs text-purple-600">
              Use at checkout
            </span>
          </div>
        </div>
      )}

      {/* Discount Code */}
      <DiscountCode cart={cart} />

      <Divider />

      {/* Totals */}
      <CartTotals totals={cart} cart={cart} />

      {/* Checkout Button */}
      <LocalizedClientLink
        href={"/checkout?step=" + step}
        data-testid="checkout-button"
        className="block"
      >
        <Button className="w-full h-14 text-base font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-slate-900/30 group">
          <span className="flex items-center justify-center gap-2">
            Proceed to Checkout
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </span>
        </Button>
      </LocalizedClientLink>

      {/* Continue Shopping Link */}
      <LocalizedClientLink
        href="/store"
        className="text-center text-sm text-slate-500 hover:text-slate-700 underline underline-offset-4"
      >
        Continue Shopping
      </LocalizedClientLink>
    </div>
  )
}

export default Summary