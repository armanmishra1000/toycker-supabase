import { convertToLocale } from "@lib/util/money"
import { Order } from "@/lib/supabase/types"

type OrderSummaryProps = {
  order: Order
}

const OrderSummary = ({ order }: OrderSummaryProps) => {
  const getAmount = (amount?: number | null) => {
    if (!amount) {
      return
    }

    return convertToLocale({
      amount,
      currency_code: order.currency_code,
    })
  }

  return (
    <div>
      <h2 className="text-base font-semibold">Order Summary</h2>
      <div className="text-sm font-normal text-ui-fg-base my-2">
        <div className="flex items-center justify-between text-base font-normal text-ui-fg-base mb-2">
          <span>Subtotal</span>
          <span>{getAmount(order.subtotal)}</span>
        </div>
        <div className="flex flex-col gap-y-1">
          {(() => {
            const metadata = order.metadata as Record<string, any> || {}
            const paymentDiscount = metadata.payment_discount_amount || 0
            const paymentPercentage = metadata.payment_discount_percentage || 0

            if (paymentDiscount > 0) {
              return (
                <div className="flex items-center justify-between">
                  <span>Payment Discount ({paymentPercentage}%)</span>
                  <span>- {getAmount(paymentDiscount)}</span>
                </div>
              )
            }
            return null
          })()}
          {order.discount_total > 0 && (() => {
            const metadata = order.metadata as Record<string, any> || {}
            const paymentDiscount = metadata.payment_discount_amount || 0
            const rewardsDiscount = metadata.rewards_discount || 0
            const promoDiscount = order.discount_total - paymentDiscount - rewardsDiscount

            if (promoDiscount > 0) {
              return (
                <div className="flex items-center justify-between">
                  <span>Promo Discount</span>
                  <span>- {getAmount(promoDiscount)}</span>
                </div>
              )
            }
            return null
          })()}
          {order.gift_card_total > 0 && (
            <div className="flex items-center justify-between">
              <span>Discount</span>
              <span>- {getAmount(order.gift_card_total)}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span>Shipping</span>
            <span>{getAmount(order.shipping_total)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Taxes</span>
            <span>{getAmount(order.tax_total)}</span>
          </div>
        </div>
        <div className="h-px w-full border-b border-gray-200 border-dashed my-4" />
        <div className="flex items-center justify-between text-base font-normal text-ui-fg-base mb-2">
          <span>Total</span>
          <span>{getAmount(order.total)}</span>
        </div>
      </div>
    </div>
  )
}

export default OrderSummary