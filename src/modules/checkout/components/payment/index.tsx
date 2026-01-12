"use client"

import { RadioGroup } from "@headlessui/react"
import { isStripeLike, paymentInfoMap } from "@lib/constants"
import { Text } from "@modules/common/components/text"
import ErrorMessage from "@modules/checkout/components/error-message"
import PaymentContainer, {
  StripeCardContainer,
} from "@modules/checkout/components/payment-container"
import { useEffect, useState } from "react"
import { Cart } from "@/lib/supabase/types"
import { useCheckout } from "../../context/checkout-context"

const Payment = ({
  cart,
  availablePaymentMethods,
}: {
  cart: Cart
  availablePaymentMethods: { id: string; name: string }[]
}) => {
  const { state, setPaymentMethod } = useCheckout()

  const [error, setError] = useState<string | null>(null)


  const paidByGiftcard = (cart.gift_card_total ?? 0) > 0 && cart.total === 0

  // Auto-select first payment method if none selected
  useEffect(() => {
    if (!state.paymentMethod && availablePaymentMethods?.length && !paidByGiftcard) {
      const firstMethod = availablePaymentMethods[0]
      if (firstMethod) {
        setPaymentMethod(firstMethod.id)
      }
    }
  }, [availablePaymentMethods, state.paymentMethod, paidByGiftcard, setPaymentMethod])

  const handlePaymentMethodChange = (method: string) => {
    setError(null)
    setPaymentMethod(method)
  }

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-4">
        <Text
          as="h2"
          weight="bold"
          className="text-3xl"
        >
          Payment Method
        </Text>
      </div>

      <div>
        {!paidByGiftcard && availablePaymentMethods?.length ? (
          <RadioGroup
            value={state.paymentMethod || ""}
            onChange={handlePaymentMethodChange}
          >
            {availablePaymentMethods.map((paymentMethod) => (
              <div key={paymentMethod.id}>
                {isStripeLike(paymentMethod.id) ? (
                  <StripeCardContainer
                    paymentProviderId={paymentMethod.id}
                    selectedPaymentOptionId={state.paymentMethod || ""}
                    paymentInfoMap={paymentInfoMap}
                    setCardBrand={() => { }}
                    setError={setError}
                    setCardComplete={() => { }}
                  />
                ) : (
                  <PaymentContainer
                    paymentInfoMap={paymentInfoMap}
                    paymentProviderId={paymentMethod.id}
                    selectedPaymentOptionId={state.paymentMethod || ""}
                  />
                )}
              </div>
            ))}
          </RadioGroup>
        ) : paidByGiftcard ? (
          <div className="flex flex-col">
            <Text weight="bold" className="text-sm text-gray-900 mb-1">
              Payment method
            </Text>
            <Text
              className="text-sm text-gray-500"
              data-testid="payment-method-summary"
            >
              Gift card (fully covers order)
            </Text>
          </div>
        ) : (
          <Text className="text-sm text-gray-500">
            No payment methods available
          </Text>
        )}

        <ErrorMessage
          error={error}
          data-testid="payment-method-error-message"
        />
      </div>
    </div>
  )
}

export default Payment