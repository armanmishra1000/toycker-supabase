import { Radio as RadioGroupOption } from "@headlessui/react"
import { Text } from "@modules/common/components/text"
import { cn } from "@lib/util/cn"
import React, { useContext, useMemo, type JSX } from "react"

import Radio from "@modules/common/components/radio"

import SkeletonCardDetails from "@modules/skeletons/components/skeleton-card-details"
import { CardElement } from "@stripe/react-stripe-js"
import { StripeCardElementOptions } from "@stripe/stripe-js"
import { StripeContext } from "../payment-wrapper/stripe-wrapper"

type PaymentContainerProps = {
  paymentProviderId: string
  selectedPaymentOptionId: string | null
  disabled?: boolean
  paymentInfoMap: Record<
    string,
    { title: string; icon: JSX.Element; description?: string }
  >
  children?: React.ReactNode
}

const PaymentContainer: React.FC<PaymentContainerProps> = ({
  paymentProviderId,
  selectedPaymentOptionId,
  paymentInfoMap,
  disabled = false,
  children,
}) => {
  const isSelected = selectedPaymentOptionId === paymentProviderId

  return (
    <RadioGroupOption
      key={paymentProviderId}
      value={paymentProviderId}
      disabled={disabled}
      className={cn(
        "group flex flex-col cursor-pointer border rounded-xl overflow-hidden transition-all duration-200 mb-4",
        {
          "border-blue-600 bg-blue-50/30 shadow-sm": isSelected,
          "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm": !isSelected,
        }
      )}
    >
      {/* Payment Method Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-3 sm:gap-4 flex-1">
          <Radio checked={isSelected} />
          <div className="flex flex-col">
            <Text className="text-sm sm:text-base font-semibold text-gray-900">
              {paymentInfoMap[paymentProviderId]?.title || paymentProviderId}
            </Text>
            {paymentInfoMap[paymentProviderId]?.description && (
              <Text className="text-xs sm:text-sm text-gray-500 mt-0.5 leading-snug">
                {paymentInfoMap[paymentProviderId]?.description}
              </Text>
            )}
          </div>
        </div>
        <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-50 group-hover:bg-gray-100 transition-colors">
          <span className="text-gray-600">
            {paymentInfoMap[paymentProviderId]?.icon}
          </span>
        </div>
      </div>

      {/* Additional Content (Card Details) */}
      {children && (
        <div className="px-4 sm:px-6 pb-4 sm:pb-5 pt-0">
          <div className="border-t border-gray-200 pt-3 sm:pt-4 mt-1">
            {children}
          </div>
        </div>
      )}
    </RadioGroupOption>
  )
}

export default PaymentContainer

export const StripeCardContainer = ({
  paymentProviderId,
  selectedPaymentOptionId,
  paymentInfoMap,
  disabled = false,
  setCardBrand,
  setError,
  setCardComplete,
}: Omit<PaymentContainerProps, "children"> & {
  setCardBrand: (brand: string) => void
  setError: (error: string | null) => void
  setCardComplete: (complete: boolean) => void
}) => {
  const stripeReady = useContext(StripeContext)

  const useOptions: StripeCardElementOptions = useMemo(() => {
    return {
      style: {
        base: {
          fontFamily: "Inter, sans-serif",
          color: "#1f2937",
          fontSize: "16px",
          "::placeholder": {
            color: "#9ca3af",
          },
        },
      },
      classes: {
        base: "block w-full px-4 py-3.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
      },
    }
  }, [])

  return (
    <PaymentContainer
      paymentProviderId={paymentProviderId}
      selectedPaymentOptionId={selectedPaymentOptionId}
      paymentInfoMap={paymentInfoMap}
      disabled={disabled}
    >
      {selectedPaymentOptionId === paymentProviderId &&
        (stripeReady ? (
          <div>
            <Text className="text-sm font-semibold text-gray-800 mb-3 block">
              Card details
            </Text>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <CardElement
                options={useOptions as StripeCardElementOptions}
                onChange={(e) => {
                  setCardBrand(
                    e.brand && e.brand.charAt(0).toUpperCase() + e.brand.slice(1)
                  )
                  setError(e.error?.message || null)
                  setCardComplete(e.complete)
                }}
              />
            </div>
          </div>
        ) : (
          <div>
            <SkeletonCardDetails />
          </div>
        ))}
    </PaymentContainer>
  )
}