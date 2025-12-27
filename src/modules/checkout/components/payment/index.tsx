"use client"

import { RadioGroup } from "@headlessui/react"
import { isPayU, isStripeLike, paymentInfoMap } from "@lib/constants"
import { initiatePaymentSession } from "@lib/data/cart"
import { CheckCircle, CreditCard } from "lucide-react"
import { Button } from "@modules/common/components/button"
import { Text } from "@modules/common/components/text"
import { cn } from "@lib/util/cn"
import ErrorMessage from "@modules/checkout/components/error-message"
import PaymentContainer, {
  StripeCardContainer,
} from "@modules/checkout/components/payment-container"
import Divider from "@modules/common/components/divider"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { Cart } from "@/lib/supabase/types"

const Payment = ({
  cart,
  availablePaymentMethods,
}: {
  cart: Cart
  availablePaymentMethods: { id: string; name: string }[]
}) => {
  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession) => paymentSession.status === "pending"
  )

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardBrand, setCardBrand] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.provider_id ?? ""
  )

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const currentStep = searchParams.get("step")
  const isOpen = currentStep === "payment"

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({ top: 0, behavior: "smooth" })
        })
      })
    }
  }, [isOpen])

  const setPaymentMethod = async (method: string) => {
    setError(null)
    setSelectedPaymentMethod(method)
    if (isStripeLike(method) || isPayU(method)) {
      const paymentData = {
        provider_id: method,
        data: {} as Record<string, unknown>
      }

      if (isPayU(method)) {
        paymentData.data = {
          email: cart.email,
          phone: cart.shipping_address?.phone,
          first_name: cart.shipping_address?.first_name,
        }
      }

      await initiatePaymentSession(cart, paymentData)
    }
  }

  const paidByGiftcard = (cart.gift_card_total ?? 0) > 0 && cart.total === 0
  const paymentReady = Boolean(activeSession) || paidByGiftcard

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)
      return params.toString()
    },
    [searchParams]
  )

  const handleEdit = () => {
    router.push(pathname + "?" + createQueryString("step", "payment"))
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const shouldInputCard =
        isStripeLike(selectedPaymentMethod) && !activeSession

      const checkActiveSession =
        activeSession?.provider_id === selectedPaymentMethod

      if (!checkActiveSession) {
        const paymentData = {
          provider_id: selectedPaymentMethod,
          data: {} as Record<string, unknown>
        }

        if (isPayU(selectedPaymentMethod)) {
          paymentData.data = {
            email: cart.email,
            phone: cart.shipping_address?.phone,
            first_name: cart.shipping_address?.first_name,
          }
        }

        await initiatePaymentSession(cart, paymentData)
      }

      if (!shouldInputCard) {
        return router.push(
          pathname + "?" + createQueryString("step", "review")
        )
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unexpected error"
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <Text
          as="h2"
          weight="bold"
          className={cn(
            "flex flex-row text-3xl gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && !paymentReady,
            }
          )}
        >
          Payment
          {!isOpen && paymentReady && <CheckCircle className="h-6 w-6 text-green-500" />}
        </Text>
        {!isOpen && paymentReady && (
          <Text>
            <button
              onClick={handleEdit}
              className="text-blue-600 hover:text-blue-700 font-medium"
              data-testid="edit-payment-button"
            >
              Edit
            </button>
          </Text>
        )}
      </div>
      <div>
        <div className={isOpen ? "block" : "hidden"}>
          {!paidByGiftcard && availablePaymentMethods?.length && (
            <RadioGroup
              value={selectedPaymentMethod}
              onChange={(value: string) => setPaymentMethod(value)}
            >
              {availablePaymentMethods.map((paymentMethod) => (
                <div key={paymentMethod.id}>
                  {isStripeLike(paymentMethod.id) ? (
                    <StripeCardContainer
                      paymentProviderId={paymentMethod.id}
                      selectedPaymentOptionId={selectedPaymentMethod}
                      paymentInfoMap={paymentInfoMap}
                      setCardBrand={setCardBrand}
                      setError={setError}
                      setCardComplete={setCardComplete}
                    />
                  ) : (
                    <PaymentContainer
                      paymentInfoMap={paymentInfoMap}
                      paymentProviderId={paymentMethod.id}
                      selectedPaymentOptionId={selectedPaymentMethod}
                    />
                  )}
                </div>
              ))}
            </RadioGroup>
          )}

          {paidByGiftcard && (
            <div className="flex flex-col w-1/3">
              <Text weight="bold" className="text-sm text-gray-900 mb-1">
                Payment method
              </Text>
              <Text
                className="text-sm text-gray-500"
                data-testid="payment-method-summary"
              >
                Gift card
              </Text>
            </div>
          )}

          <ErrorMessage
            error={error}
            data-testid="payment-method-error-message"
          />

          <Button
            size="large"
            className="mt-6"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={
              (isStripeLike(selectedPaymentMethod) && !cardComplete) ||
              (!selectedPaymentMethod && !paidByGiftcard)
            }
            data-testid="submit-payment-button"
          >
            {!activeSession && isStripeLike(selectedPaymentMethod)
              ? " Enter card details"
              : "Continue to review"}
          </Button>
        </div>

        <div className={isOpen ? "hidden" : "block"}>
          {cart && paymentReady && activeSession ? (
            <div className="flex items-start gap-x-1 w-full">
              <div className="flex flex-col w-1/3">
                <Text weight="bold" className="text-sm text-gray-900 mb-1">
                  Payment method
                </Text>
                <Text
                  className="text-sm text-gray-500"
                  data-testid="payment-method-summary"
                >
                  {paymentInfoMap[activeSession?.provider_id]?.title ||
                    activeSession?.provider_id}
                </Text>
              </div>
              <div className="flex flex-col w-1/3">
                <Text weight="bold" className="text-sm text-gray-900 mb-1">
                  Payment details
                </Text>
                <div
                  className="flex gap-2 text-sm text-gray-500 items-center"
                  data-testid="payment-details-summary"
                >
                  <div className="flex items-center h-7 w-fit p-2 bg-gray-100 rounded">
                    {paymentInfoMap[selectedPaymentMethod]?.icon || (
                      <CreditCard className="h-4 w-4" />
                    )}
                  </div>
                  <Text>
                    {isStripeLike(selectedPaymentMethod) && cardBrand
                      ? cardBrand
                      : "Another step will appear"}
                  </Text>
                </div>
              </div>
            </div>
          ) : paidByGiftcard ? (
            <div className="flex flex-col w-1/3">
              <Text weight="bold" className="text-sm text-gray-900 mb-1">
                Payment method
              </Text>
              <Text
                className="text-sm text-gray-500"
                data-testid="payment-method-summary"
              >
                Gift card
              </Text>
            </div>
          ) : null}
        </div>
      </div>
      <Divider className="mt-8" />
    </div>
  )
}

export default Payment