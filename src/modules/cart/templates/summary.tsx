"use client"

import { Button } from "@modules/common/components/button"
import { Text } from "@modules/common/components/text"
import CartTotals from "@modules/common/components/cart-totals"
import DiscountCode from "@modules/checkout/components/discount-code"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Cart } from "@/lib/supabase/types"
import { convertToLocale } from "@lib/util/money"
import { Package, ArrowRight, ShoppingBag } from "lucide-react"
import { cn } from "@lib/util/cn"
import { useCartStore } from "@modules/cart/context/cart-store-context"

type SummaryProps = {
  cart: Cart
}

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
  const { isSyncing } = useCartStore()
  const step = getCheckoutStep(cart)
  const itemCount = cart.items?.length || 0
  const subtotal = cart.item_subtotal || cart.subtotal || 0
  const threshold = cart.free_shipping_threshold || 500
  const amountToFreeShipping = Math.max(0, threshold - subtotal)
  const hasFreeShipping = amountToFreeShipping === 0
  const progressPercentage = Math.min(100, (subtotal / threshold) * 100)
  const currencyCode = cart.currency_code || "INR"

  // Rewards info for club members
  const availableRewards = cart.available_rewards || 0
  const isClubMember = cart.is_club_member || false

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Item Count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <Text as="h2" weight="bold" className="text-xl text-slate-900 leading-none mb-1">
              Order Summary
            </Text>
            <span className="text-sm font-medium text-slate-400">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Banners Section */}
      <div className="flex flex-col gap-3">
        {/* Free Shipping Progress */}
        <div className="group relative overflow-hidden bg-slate-50/50 rounded-2xl p-4 border border-slate-100 transition-all duration-300 hover:border-blue-200 hover:bg-white hover:shadow-md hover:shadow-blue-500/5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-300",
                hasFreeShipping ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
              )}>
                <Package className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col">
                <span className={cn(
                  "text-xs font-bold uppercase tracking-wider",
                  hasFreeShipping ? "text-green-600" : "text-blue-600"
                )}>
                  {hasFreeShipping ? "Free Shipping Unlocked" : "Shipping Progress"}
                </span>
                {hasFreeShipping ? (
                  <p className="text-sm font-semibold text-slate-900">
                    Congrats! Your order ships free.
                  </p>
                ) : (
                  <p className="text-sm text-slate-600">
                    <span className="font-bold text-slate-900">{convertToLocale({ amount: amountToFreeShipping, currency_code: currencyCode })}</span> away from free delivery
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="relative h-1.5 bg-slate-200/50 rounded-full overflow-hidden">
            <div
              className={cn(
                "absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out",
                hasFreeShipping
                  ? "bg-gradient-to-r from-green-400 to-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                  : "bg-gradient-to-r from-blue-400 to-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]"
              )}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Rewards Banner */}
        {isClubMember && availableRewards > 0 && (
          <div className="relative overflow-hidden bg-purple-50/50 rounded-2xl p-4 border border-purple-100 transition-all duration-300 hover:border-purple-200 hover:bg-white hover:shadow-md hover:shadow-purple-500/5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                  <span className="text-lg">✨</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Rewards Available</span>
                  <span className="text-sm font-bold text-purple-900">
                    {availableRewards} Points (₹{availableRewards})
                  </span>
                </div>
              </div>
              <div className="px-2.5 py-1 bg-white border border-purple-100 rounded-full text-[10px] font-bold text-purple-600 shadow-sm whitespace-nowrap">
                Apply at checkout
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Promo Section */}
        <div className="bg-white rounded-2xl p-1 border border-gray-200">
          <DiscountCode cart={cart} />
        </div>

        {/* Totals Breakdown */}
        <div className="px-1">
          <CartTotals totals={cart} cart={cart} />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-2">
          <LocalizedClientLink
            href={"/checkout?step=" + step}
            data-testid="checkout-button"
            className={cn("block", isSyncing && "pointer-events-none")}
          >
            <Button
              className="w-full h-14 text-base font-bold rounded-2xl bg-slate-900 hover:bg-primary text-white transition-all shadow-xl shadow-none group disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSyncing}
            >
              <span className="flex items-center justify-center gap-2.5">
                {isSyncing ? "Updating Cart..." : "Proceed to Checkout"}
                {!isSyncing && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />}
              </span>
            </Button>
          </LocalizedClientLink>

          <LocalizedClientLink
            href="/store"
            className="flex items-center justify-center gap-2 py-2 text-sm text-slate-500 hover:text-slate-900 font-semibold transition-colors duration-200"
          >
            <span>Continue Shopping</span>
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}

export default Summary