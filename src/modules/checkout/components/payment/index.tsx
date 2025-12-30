"use client"

import { RadioGroup } from "@headlessui/react"
import { isPayU, isStripeLike, paymentInfoMap } from "@lib/constants"
import { initiatePaymentSession } from "@lib/data/cart"
import { Text } from "@modules/common/components/text"
import ErrorMessage from "@modules/checkout/components/error-message"
import PaymentContainer, {
  StripeCardContainer,
} from "@modules/checkout/components/payment-container"
import Divider from "@modules/common/components/divider"
import { useEffect, useState } from "react"
import { Cart } from "@/lib/supabase/types"

const Payment = ({
  cart,
  availablePaymentMethods,
  selectedPaymentMethod,
  onPaymentMethodChange,
}: {
  cart: Cart
  availablePaymentMethods: { id: string; name: string }[]
  selectedPaymentMethod?: string
  onPaymentMethodChange?: (method: string) => void
}) => {
  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession) => paymentSession.status === "pending"
  )

  const [error, setError] = useState<string | null>(null)
  const [cardBrand, setCardBrand] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)

  // Use prop if available, otherwise local state (though with prop control, local state is redundant for selection)
  // We'll use local state to track what to display if parent doesn't maximize control, 
  // but better to rely on parent prop for the "instant" feeling if checking across components.
  // Actually, let's keep local state for RadioGroup but sync with parent.
  const [internalSelection, setInternalSelection] = useState(
    activeSession?.provider_id ?? ""
  )

  const currentSelection = selectedPaymentMethod ?? internalSelection

  const paidByGiftcard = (cart.gift_card_total ?? 0) > 0 && cart.total === 0

  // Auto-select first payment method if none selected
  useEffect(() => {
    if (!currentSelection && availablePaymentMethods?.length && !paidByGiftcard) {
      const firstMethod = availablePaymentMethods[0]
      if (firstMethod) {
        setPaymentMethod(firstMethod.id)
      }
    }
  }, [availablePaymentMethods, currentSelection, paidByGiftcard])

  const setPaymentMethod = async (method: string) => {
    setError(null)
    setInternalSelection(method)
    if (onPaymentMethodChange) {
      onPaymentMethodChange(method)
    }

    try {
      // Save ALL payment methods to database (including COD)
      const paymentData: { provider_id: string; data: Record<string, unknown> } = {
        provider_id: method,
        data: {}
      }

      // Add extra data for PayU
      if (isPayU(method)) {
        paymentData.data = {
          email: cart.email,
          phone: cart.shipping_address?.phone,
          first_name: cart.shipping_address?.first_name,
        }
      }

      await initiatePaymentSession(cart, paymentData)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to set payment method"
      setError(message)
    }
  }

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <Text
          as="h2"
          weight="bold"
          className="flex flex-row text-3xl gap-x-2 items-baseline"
        >
          Payment Method
        </Text>
      </div>

      <div>
        {!paidByGiftcard && availablePaymentMethods?.length ? (
          <RadioGroup
            value={currentSelection}
            onChange={(value: string) => setPaymentMethod(value)}
          >
            {availablePaymentMethods.map((paymentMethod) => (
              <div key={paymentMethod.id}>
                {isStripeLike(paymentMethod.id) ? (
                  <StripeCardContainer
                    paymentProviderId={paymentMethod.id}
                    selectedPaymentOptionId={currentSelection}
                    paymentInfoMap={paymentInfoMap}
                    setCardBrand={setCardBrand}
                    setError={setError}
                    setCardComplete={setCardComplete}
                  />
                ) : (
                  <PaymentContainer
                    paymentInfoMap={paymentInfoMap}
                    paymentProviderId={paymentMethod.id}
                    selectedPaymentOptionId={currentSelection}
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
      <Divider className="mt-8" />
    </div>
  )
}

export default Payment