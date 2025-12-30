"use client"

import { Button } from "@modules/common/components/button"
import { Text } from "@modules/common/components/text"
import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import DiscountCode from "@modules/checkout/components/discount-code"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Cart } from "@/lib/supabase/types"
import { convertToLocale } from "@lib/util/money"
import { Package, ArrowRight, ShoppingBag } from "lucide-react"

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
    <div className="flex flex-col gap-4 sm:gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <Text as="h2" weight="bold" className="text-lg sm:text-xl text-slate-900">
              Order Summary
            </Text>
            <span className="text-xs sm:text-sm text-slate-500">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
          </div>
        </div>
      </div>

      {/* Free Shipping Progress */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 sm:p-5 border border-blue-100 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${hasFreeShipping ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
            <Package className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            {hasFreeShipping ? (
              <p className="text-sm font-semibold text-green-700">
                🎉 You&apos;ve unlocked FREE shipping!
              </p>
            ) : (
              <p className="text-sm text-slate-700">
                Add <strong className="text-slate-900">{convertToLocale({ amount: amountToFreeShipping, currency_code: currencyCode })}</strong> more for free shipping
              </p>
            )}
          </div>
        </div>
        <div className="h-2 bg-slate-200/80 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${hasFreeShipping ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gradient-to-r from-blue-400 to-blue-500'}`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Rewards Available Banner (Club Members) */}
      {isClubMember && availableRewards > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 sm:p-5 border border-purple-100 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xl">🎁</span>
              <span className="text-sm font-medium text-purple-900 truncate">
                <strong>{availableRewards}</strong> reward points available
              </span>
            </div>
            <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2.5 py-1 rounded-full shrink-0">
              Apply at checkout
            </span>
          </div>
        </div>
      )}

      {/* Discount Code */}
      <DiscountCode cart={cart} />

      <Divider className="my-1" />

      {/* Totals */}
      <CartTotals totals={cart} cart={cart} />

      {/* Checkout Button */}
      <LocalizedClientLink
        href={"/checkout?step=" + step}
        data-testid="checkout-button"
        className="block mt-2"
      >
        <Button className="w-full h-12 sm:h-13 text-sm sm:text-base font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-slate-900/30 hover:-translate-y-0.5 active:translate-y-0 group">
          <span className="flex items-center justify-center gap-2.5">
            Proceed to Checkout
            <ArrowRight className="w-4.5 h-4.5 sm:w-5 sm:h-5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </Button>
      </LocalizedClientLink>

      {/* Continue Shopping Link */}
      <LocalizedClientLink
        href="/store"
        className="text-center text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
      >
        Continue Shopping
      </LocalizedClientLink>
    </div>
  )
}

export default Summary