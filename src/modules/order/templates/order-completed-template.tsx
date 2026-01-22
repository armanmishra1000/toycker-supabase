import CartTotals from "@modules/common/components/cart-totals"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OrderDetails from "@modules/order/components/order-details"
import ShippingDetails from "@modules/order/components/shipping-details"
import { Order } from "@/lib/supabase/types"
import ClubWelcomeBanner from "@modules/order/components/club-welcome-banner"
import { ClearCartOnMount } from "@modules/order/components/clear-cart-on-mount"
import { Check, XCircle, AlertCircle } from "lucide-react"
import CancelOrderButton from "@modules/order/components/cancel-order-button"
import OrderTracking from "@modules/order/components/order-tracking"

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

  const isCancelled = order.status === "cancelled" || order.payment_status === "failed"
  const canUserCancel = order.status === "order_placed" || order.status === "pending"

  return (
    <div className="py-12 min-h-[calc(100vh-64px)] bg-slate-50/50">
      <ClearCartOnMount />
      <div className="content-container flex flex-col justify-center items-center gap-y-8 max-w-4xl h-full w-full">
        {/* Celebratory Header Card */}
        <div className={`w-full bg-white rounded-3xl border p-8 sm:p-12 shadow-xl flex flex-col items-center text-center relative overflow-hidden ${isCancelled ? "border-red-100 shadow-red-900/5" : "border-emerald-100 shadow-emerald-900/5"
          }`}>
          {/* Decorative Background Spreads */}
          {!isCancelled && (
            <>
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-60" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-teal-50 rounded-full blur-3xl opacity-60" />
            </>
          )}

          <div className="relative mb-6">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform ${isCancelled
                ? "bg-red-500 shadow-red-200"
                : "bg-emerald-500 shadow-emerald-200 rotate-3 hover:rotate-6"
              }`}>
              {isCancelled ? <XCircle className="w-10 h-10 text-white" /> : <Check className="w-10 h-10 text-white" />}
            </div>
            {!isCancelled && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-sm -rotate-12">
                <span className="text-xs">✨</span>
              </div>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3 tracking-tight">
            {isCancelled ? "Order Cancelled" : "Order Confirmed!"}
          </h1>
          <p className="text-slate-600 text-lg max-w-md mx-auto leading-relaxed">
            {isCancelled
              ? "This order was not successful. If this was a mistake, you can try placing it again from your cart."
              : "Thank you for shopping with Toycker. We're getting your order ready for delivery."
            }
          </p>
          {!isCancelled && canUserCancel && (
            <div className="mt-6">
              <CancelOrderButton orderId={order.id} />
            </div>
          )}
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

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Track your order</p>
                  <h3 className="text-2xl font-black text-slate-900">Stay updated on every step</h3>
                  <p className="text-sm text-slate-500">Live updates as we prepare, ship, and deliver your package.</p>
                </div>
                <div className="hidden sm:flex flex-col items-end text-right text-xs text-slate-500 font-semibold">
                  <span>Order ID</span>
                  <span className="text-sm font-black text-slate-900">#{order.display_id}</span>
                </div>
              </div>
              <div className="mt-6">
                <OrderTracking order={order} />
              </div>
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