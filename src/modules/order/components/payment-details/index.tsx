import { Text } from "@modules/common/components/text"

import { isStripeLike, paymentInfoMap } from "@lib/constants"
import Divider from "@modules/common/components/divider"
import { convertToLocale } from "@lib/util/money"
import { Order } from "@/lib/supabase/types"

type PaymentDetailsProps = {
  order: Order
}

const PaymentDetails = ({ order }: PaymentDetailsProps) => {
  const payment = order.payment_collections?.[0].payments?.[0]

  return (
    <div>
      <h2 className="flex flex-row text-3xl font-normal my-6">
        Payment
      </h2>
      <div>
        {payment && (
          <div className="flex items-start gap-x-1 w-full">
            <div className="flex flex-col w-1/3">
              <Text className="text-base font-semibold text-ui-fg-base mb-1">
                Payment method
              </Text>
              <Text
                className="text-base font-medium text-ui-fg-subtle"
                data-testid="payment-method"
              >
                {paymentInfoMap[payment.provider_id].title}
              </Text>
            </div>
            <div className="flex flex-col w-2/3">
              <Text className="text-base font-semibold text-ui-fg-base mb-1">
                Payment details
              </Text>
              <div className="flex gap-2 text-base font-medium text-ui-fg-subtle items-center">
                <div className="flex items-center h-7 w-fit p-2 bg-gray-100 rounded">
                  {paymentInfoMap[payment.provider_id].icon}
                </div>
                <Text data-testid="payment-amount">
                  {isStripeLike(payment.provider_id) && payment.data?.card_last4
                    ? `**** **** **** ${payment.data.card_last4}`
                    : `${convertToLocale({
                        amount: payment.amount,
                        currency_code: order.currency_code,
                      })} paid at ${new Date(
                        payment.created_at ?? ""
                      ).toLocaleString()}`}
                </Text>
              </div>
            </div>
          </div>
        )}
      </div>

      <Divider className="mt-8" />
    </div>
  )
}

export default PaymentDetails