import CartTotals from "@modules/common/components/cart-totals"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OrderDetails from "@modules/order/components/order-details"
import ShippingDetails from "@modules/order/components/shipping-details"
import { Order } from "@/lib/supabase/types"
import ClubWelcomeBanner from "@modules/order/components/club-welcome-banner"
import { ClearCartOnMount } from "@modules/order/components/clear-cart-on-mount"
import { Check } from "lucide-react"

type OrderCompletedTemplateProps = {
  order: Order
}

export default async function OrderCompletedTemplate({
  order,
}: OrderCompletedTemplateProps) {
  // Membership activation now happens in placeOrder server action (cart.ts)
  // We just read the result from order metadata here
  const metadata = order.metadata as Record<string, unknown> | null
  const newlyActivated = metadata?.newly_activated_club_member === true
  const discountPercentage = typeof metadata?.club_discount_percentage === 'number'
    ? metadata.club_discount_percentage
    : 10

  return (
    <div className="py-12 min-h-[calc(100vh-64px)] bg-slate-50/50">
      <ClearCartOnMount />
      <div className="content-container flex flex-col justify-center items-center gap-y-8 max-w-4xl h-full w-full">
        {/* Celebratory Header Card */}
        <div className="w-full bg-white rounded-3xl border border-emerald-100 p-8 sm:p-12 shadow-xl shadow-emerald-900/5 flex flex-col items-center text-center relative overflow-hidden">
          {/* Decorative Background Spreads */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-60" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-teal-50 rounded-full blur-3xl opacity-60" />

          <div className="relative mb-6">
            <div className="w-20 h-20 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 rotate-3 transform transition-transform hover:rotate-6">
              <Check className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-sm -rotate-12">
              <span className="text-xs">✨</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3 tracking-tight">
            Order Confirmed!
          </h1>
          <p className="text-slate-600 text-lg max-w-md mx-auto leading-relaxed">
            Thank you for shopping with Toycker. We&apos;re getting your order ready for delivery.
          </p>
        </div>

        {/* Main Content Grid */}
        <div
          className="flex flex-col gap-8 w-full"
          data-testid="order-complete-container"
        >
          {newlyActivated && (
            <ClubWelcomeBanner discountPercentage={discountPercentage} />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10">
              <OrderDetails order={order} />
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 sm:px-10 pt-8 pb-6 border-b border-slate-100">
                <h3 className="text-2xl font-black text-slate-900">Order Summary</h3>
                <p className="text-sm text-slate-500 mt-1">Review your purchase details</p>
              </div>
              <Items order={order} />
              <div className="bg-gradient-to-b from-slate-50/50 to-white p-6 sm:p-10 border-t border-slate-100">
                <CartTotals totals={order} order={order} />
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10">
              <ShippingDetails order={order} />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10">
            <Help />
          </div>
        </div>
      </div>
    </div>
  )
}