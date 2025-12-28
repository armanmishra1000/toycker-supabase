import { Text } from "@modules/common/components/text"

import CartTotals from "@modules/common/components/cart-totals"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OrderDetails from "@modules/order/components/order-details"
import ShippingDetails from "@modules/order/components/shipping-details"
import PaymentDetails from "@modules/order/components/payment-details"
import { Order } from "@/lib/supabase/types"

type OrderCompletedTemplateProps = {
  order: Order
}

import { checkAndActivateMembership } from "@lib/data/club"
import ClubWelcomeBanner from "@modules/order/components/club-welcome-banner"
import { getClubSettings } from "@lib/data/club"

// ... imports

export default async function OrderCompletedTemplate({
  order,
}: OrderCompletedTemplateProps) {
  // Check and activate membership
  // Note: This runs on the server when the page is rendered.
  // Ideally this should be done in a webhook or the checkout completion handler, 
  // but for this prototype we do it here to ensure the user gets feedback immediately 
  // upon viewing the valid order confirmation.
  // We should pass the user ID if available. 

  let newlyActivated = false
  let discountPercentage = 10

  // Assuming 'user_id' is on the order object, or we use the current auth session
  // order.user_id is usually available for logged in users
  if (order.user_id) {
    const settings = await getClubSettings()
    discountPercentage = settings.discount_percentage
    newlyActivated = await checkAndActivateMembership(order.user_id, order.total)
  }

  return (
    <div className="py-6 min-h-[calc(100vh-64px)]">
      <div className="content-container flex flex-col justify-center items-center gap-y-10 max-w-4xl h-full w-full">
        <div
          className="flex flex-col gap-4 max-w-4xl h-full bg-white w-full py-10"
          data-testid="order-complete-container"
        >
          {newlyActivated && (
            <ClubWelcomeBanner discountPercentage={discountPercentage} />
          )}
          <Text
            as="h1"
            weight="bold"
            className="flex flex-col gap-y-3 text-gray-900 text-3xl mb-4"
          >
            <span>Thank you!</span>
            <span>Your order was placed successfully.</span>
          </Text>
          <OrderDetails order={order} />
          <Text as="h2" weight="bold" className="flex flex-row text-3xl">
            Summary
          </Text>
          <Items order={order} />
          <CartTotals totals={order} />
          <ShippingDetails order={order} />
          <PaymentDetails order={order} />
          <Help />
        </div>
      </div>
    </div>
  )
}