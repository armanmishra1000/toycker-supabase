"use client"

import ItemsTemplate from "./items"
import Summary from "./summary"
import EmptyCartMessage from "../components/empty-cart-message"
import SignInPrompt from "../components/sign-in-prompt"
import Divider from "@modules/common/components/divider"
import { useCartStore } from "@modules/cart/context/cart-store-context"
import { Cart, CustomerProfile } from "@/lib/supabase/types"
import { Shield, Truck, RotateCcw, Sparkles } from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type CartTemplateProps = {
  cart: Cart | null
  customer: CustomerProfile | null
}

const CartTemplate = ({
  cart,
  customer,
}: CartTemplateProps) => {
  const { cart: clientCart } = useCartStore()
  const activeCart = clientCart ?? cart
  const isClubMember = customer?.is_club_member || activeCart?.is_club_member || false
  const itemCount = activeCart?.items?.length || 0

  return (
    <div className="min-h-screen py-6 sm:py-8 lg:py-12">
      <div className="content-container px-3 sm:px-4" data-testid="cart-container">
        {activeCart?.items?.length ? (
          <>
            {/* Club Promotion Banner for Non-Members */}
            {!isClubMember && (
              <div className="mb-6 sm:mb-8 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 border border-amber-200/50 rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-200/50">
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
                        Join Toycker Club & Save 10%!
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600">
                        Spend ₹999+ on a single order and unlock <strong>lifetime discounts</strong> on everything.
                      </p>
                    </div>
                  </div>
                  <LocalizedClientLink
                    href="/club"
                    className="shrink-0 px-4 py-2 sm:px-5 sm:py-2.5 bg-white hover:bg-slate-50 text-slate-900 font-semibold rounded-full border border-slate-200 shadow-sm transition-all hover:shadow-md text-xs sm:text-sm"
                  >
                    Learn More →
                  </LocalizedClientLink>
                </div>
              </div>
            )}

            {/* Main Cart Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] 2xl:grid-cols-[1fr_450px] gap-6 sm:gap-8 lg:gap-10 xl:gap-12 2xl:gap-14">
              {/* Left Column: Cart Items */}
              <div className="flex flex-col gap-y-4 sm:gap-y-6">
                {!customer && (
                  <>
                    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100">
                      <SignInPrompt />
                    </div>
                    <Divider />
                  </>
                )}
                <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-sm border border-gray-200">
                  <ItemsTemplate cart={activeCart} />
                </div>
              </div>

              {/* Right Column: Summary */}
              <div className="lg:sticky lg:top-8 h-fit">
                <div className="flex flex-col gap-4 sm:gap-6">
                  {/* Order Summary Card */}
                  <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-sm border border-gray-200">
                    <Summary cart={activeCart} />
                  </div>

                  {/* Trust Badges */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <div className="grid grid-cols-3 gap-4">
                      <TrustBadge
                        icon={<Shield className="w-5 h-5" />}
                        label="Secure"
                        sublabel="Checkout"
                      />
                      <TrustBadge
                        icon={<Truck className="w-5 h-5" />}
                        label="Fast"
                        sublabel="Delivery"
                      />
                      <TrustBadge
                        icon={<RotateCcw className="w-5 h-5" />}
                        label="Easy"
                        sublabel="Returns"
                      />
                    </div>
                  </div>

                  {/* Help Text */}
                  <div className="flex flex-col items-center gap-1 mt-2">
                    <p className="text-[11px] font-medium text-slate-400">
                      Need help with your order?
                    </p>
                    <LocalizedClientLink
                      href="/contact"
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors underline underline-offset-4 decoration-slate-200 hover:decoration-slate-900"
                    >
                      Chat with support
                    </LocalizedClientLink>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
            <EmptyCartMessage />
          </div>
        )}
      </div>
    </div>
  )
}

function TrustBadge({ icon, label, sublabel }: { icon: React.ReactNode; label: string; sublabelText?: string; sublabel: string }) {
  return (
    <div className="flex flex-col items-center text-center group cursor-default">
      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 transition-all duration-300 group-hover:bg-slate-900 group-hover:text-white group-hover:scale-110 group-hover:rotate-3 shadow-inner">
        {icon}
      </div>
      <div className="mt-3 flex flex-col items-center leading-none">
        <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">{label}</span>
        <span className="text-[10px] font-medium text-slate-400 mt-0.5">{sublabel}</span>
      </div>
    </div>
  )
}

export default CartTemplate
