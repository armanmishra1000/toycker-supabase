import { Text } from "@modules/common/components/text"

import { paymentInfoMap } from "@lib/constants"
import Divider from "@modules/common/components/divider"
import { convertToLocale } from "@lib/util/money"
import { Order } from "@/lib/supabase/types"
import { CreditCard, Wallet, Smartphone } from "lucide-react"

type PaymentDetailsProps = {
  order: Order
}

const PaymentDetails = ({ order }: PaymentDetailsProps) => {
  const payment = order.payment_collections?.[0]?.payments?.[0]
  const fallbackPaymentMethod = order.payment_method

  // Determine payment info from payment_collections or fallback to payment_method field
  const getPaymentInfo = () => {
    if (payment) {
      return {
        providerId: payment.provider_id,
        title: paymentInfoMap[payment.provider_id]?.title || "Payment",
        icon: paymentInfoMap[payment.provider_id]?.icon,
        amount: payment.amount,
        cardLast4: payment.data?.card_last4,
        createdAt: payment.created_at,
      }
    }

    // Fallback to order.payment_method
    if (fallbackPaymentMethod) {
      const methodKey = fallbackPaymentMethod.toLowerCase()
      if (methodKey.includes("stripe") || methodKey.includes("card") || methodKey.includes("credit")) {
        return {
          providerId: "stripe",
          title: "Credit Card",
          icon: <CreditCard className="h-4 w-4" />,
        }
      } else if (methodKey.includes("cod") || methodKey.includes("cash")) {
        return {
          providerId: "cod",
          title: "Cash on Delivery",
          icon: <Wallet className="h-4 w-4" />,
        }
      } else if (methodKey.includes("payu") || methodKey.includes("online") || methodKey.includes("upi")) {
        return {
          providerId: "online",
          title: "Online Payment",
          icon: <Smartphone className="h-4 w-4" />,
        }
      }
    }

    return null
  }

  const paymentInfo = getPaymentInfo()

  return (
    <div>
      <h2 className="flex flex-row text-3xl font-normal my-6">
        Payment
      </h2>
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        {paymentInfo ? (
          <div className="flex items-start gap-x-4 w-full">
            <div className="flex flex-col min-w-[120px]">
              <Text className="text-sm font-medium text-gray-500 mb-2">
                Payment Method
              </Text>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center h-8 w-8 bg-white rounded-lg border border-gray-200 shadow-sm">
                  {paymentInfo.icon}
                </div>
                <Text
                  className="text-base font-semibold text-gray-900"
                  data-testid="payment-method"
                >
                  {paymentInfo.title}
                </Text>
              </div>
            </div>
            <div className="flex flex-col flex-1">
              <Text className="text-sm font-medium text-gray-500 mb-2">
                Details
              </Text>
              {paymentInfo.cardLast4 ? (
                <Text className="text-base font-medium text-gray-900" data-testid="payment-card">
                  Ending in {paymentInfo.cardLast4}
                </Text>
              ) : paymentInfo.amount !== undefined ? (
                <Text className="text-base font-medium text-gray-900" data-testid="payment-amount">
                  {convertToLocale({
                    amount: paymentInfo.amount,
                    currency_code: order.currency_code,
                  })}
                  {paymentInfo.createdAt && ` paid on ${new Date(paymentInfo.createdAt).toLocaleDateString()}`}
                </Text>
              ) : (
                <Text className="text-base font-medium text-gray-900">
                  Payment completed successfully
                </Text>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <Text className="text-base text-gray-500">
              Payment information will be updated once processing is complete.
            </Text>
          </div>
        )}
      </div>

      <Divider className="mt-8" />
    </div>
  )
}

export default PaymentDetails