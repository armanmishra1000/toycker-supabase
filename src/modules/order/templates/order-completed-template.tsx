import { Text } from "@modules/common/components/text"

import CartTotals from "@modules/common/components/cart-totals"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OrderDetails from "@modules/order/components/order-details"
import ShippingDetails from "@modules/order/components/shipping-details"
import PaymentDetails from "@modules/order/components/payment-details"
import { Order } from "@/lib/supabase/types"
import ClubWelcomeBanner from "@modules/order/components/club-welcome-banner"
import { CheckCircle } from "lucide-react"

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
    <div className="py-6 min-h-[calc(100vh-64px)] bg-gray-50">
      <div className="content-container flex flex-col justify-center items-center gap-y-6 max-w-4xl h-full w-full">
        {/* Success Header Card */}
        <div className="w-full bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="h-14 w-14 sm:h-16 sm:w-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <Text
                as="h1"
                weight="bold"
                className="text-2xl sm:text-3xl text-gray-900"
              >
                Thank you! Your order was placed successfully.
              </Text>
              <Text className="text-sm sm:text-base text-gray-600 mt-1">
                We&apos;ve sent a confirmation to <span className="font-semibold text-gray-900">{order.customer_email || order.email}</span>
              </Text>
            </div>
          </div>
        </div>

        {/* Order Details Card */}
        <div
          className="flex flex-col gap-6 w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8"
          data-testid="order-complete-container"
        >
          {newlyActivated && (
            <ClubWelcomeBanner discountPercentage={discountPercentage} />
          )}

          <OrderDetails order={order} />

          <Text as="h2" weight="bold" className="text-2xl text-gray-900">
            Order Summary
          </Text>

          <Items order={order} />
          <CartTotals totals={order} order={order} />

          <ShippingDetails order={order} />
          <PaymentDetails order={order} />

          <Help />
        </div>
      </div>
    </div>
  )
}