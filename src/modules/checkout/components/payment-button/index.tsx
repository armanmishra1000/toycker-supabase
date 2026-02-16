"use client"

import { isManual, isStripeLike, isPayU } from "@lib/constants"
import { Button } from "@modules/common/components/button"
import { useElements, useStripe } from "@stripe/react-stripe-js"
import React, { useState } from "react"
import ErrorMessage from "../error-message"
import { Cart } from "@/lib/supabase/types"
import { useCheckout } from "../../context/checkout-context"
import { completeCheckout } from "@/lib/actions/complete-checkout"
import { useRouter } from "next/navigation"

type PaymentButtonProps = {
  cart: Cart
  "data-testid": string
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  cart,
  "data-testid": dataTestId,
}) => {
  const { state } = useCheckout()

  // Check if all required data is filled
  const notReady = !state.isValid

  switch (true) {
    case isStripeLike(state.paymentMethod ?? undefined):
      return (
        <StripePaymentButton
          notReady={notReady}
          cart={cart}
          data-testid={dataTestId}
        />
      )
    case isManual(state.paymentMethod ?? undefined):
      return (
        <ManualTestPaymentButton
          notReady={notReady}
          cart={cart}
          data-testid={dataTestId}
        />
      )
    case isPayU(state.paymentMethod ?? undefined):
      return (
        <PayUPaymentButton
          notReady={notReady}
          cart={cart}
          data-testid={dataTestId}
        />
      )
    default:
      return <Button disabled>Select a payment method</Button>
  }
}

const StripePaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: Cart
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { state, isPaymentUpdating } = useCheckout()
  const router = useRouter()

  const stripe = useStripe()
  const elements = useElements()
  const card = elements?.getElement("card")

  const disabled = !stripe || !elements || notReady || isPaymentUpdating

  const handlePayment = async () => {
    setSubmitting(true)
    setErrorMessage(null)

    if (!stripe || !elements || !card || !cart) {
      setSubmitting(false)
      return
    }

    if (!state.shippingAddress || !state.paymentMethod) {
      setErrorMessage("Please fill all required fields")
      setSubmitting(false)
      return
    }

    try {
      // Step 1: Complete checkout (create order atomically)
      const result = await completeCheckout({
        cartId: cart.id,
        email: state.email || "",
        shippingAddress: state.shippingAddress,
        billingAddress: state.billingAddress || state.shippingAddress,
        paymentMethod: state.paymentMethod,
        rewardsToApply: state.rewardsToApply,
        saveAddress: state.saveAddress,
      })

      if (!result.success) {
        setErrorMessage(result.error || "Order creation failed")
        setSubmitting(false)
        return
      }

      // Step 2: Process Stripe payment confirmation
      const clientSecret = result.paymentData?.client_secret
      if (clientSecret) {
        const { error: confirmError, paymentIntent } =
          await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
              card: card,
              billing_details: {
                name: `${state.shippingAddress.first_name} ${state.shippingAddress.last_name}`,
                email: cart.email || undefined,
                phone: state.shippingAddress.phone || undefined,
                address: {
                  line1: state.shippingAddress.address_1,
                  line2: state.shippingAddress.address_2 || undefined,
                  city: state.shippingAddress.city,
                  postal_code: state.shippingAddress.postal_code,
                  country: state.shippingAddress.country_code,
                },
              },
            },
          })

        if (confirmError) {
          setErrorMessage(confirmError.message || "Payment confirmation failed")
          setSubmitting(false)
          return
        }

        if (
          paymentIntent?.status !== "succeeded" &&
          paymentIntent?.status !== "requires_capture"
        ) {
          setErrorMessage("Payment status is not authorized")
          setSubmitting(false)
          return
        }
      }

      // Step 3: Redirect to order confirmation
      router.push(`/order/confirmed/${result.orderId}`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Payment failed")
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button
        disabled={disabled || submitting}
        onClick={handlePayment}
        size="large"
        isLoading={submitting}
        className="w-full hover:bg-primary"
        data-testid={dataTestId}
      >
        Place order
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="stripe-payment-error-message"
      />
    </>
  )
}

const ManualTestPaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: Cart
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { state, isPaymentUpdating } = useCheckout()
  const router = useRouter()

  const handlePayment = async () => {
    setSubmitting(true)
    setErrorMessage(null)

    if (!state.shippingAddress || !state.paymentMethod) {
      setErrorMessage("Please fill all required fields")
      setSubmitting(false)
      return
    }

    try {
      const result = await completeCheckout({
        cartId: cart.id,
        email: state.email || "",
        shippingAddress: state.shippingAddress,
        billingAddress: state.billingAddress || state.shippingAddress,
        paymentMethod: state.paymentMethod,
        rewardsToApply: state.rewardsToApply,
        saveAddress: state.saveAddress,
      })

      if (!result.success) {
        setErrorMessage(result.error || "Order creation failed")
        setSubmitting(false)
        return
      }

      // Redirect to order confirmation
      router.push(`/order/confirmed/${result.orderId}`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Order failed")
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button
        disabled={notReady || submitting || isPaymentUpdating}
        isLoading={submitting}
        onClick={handlePayment}
        size="large"
        className="w-full hover:bg-primary"
        data-testid={dataTestId}
      >
        Place order
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="manual-payment-error-message"
      />
    </>
  )
}

const PayUPaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: Cart
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { state, isPaymentUpdating } = useCheckout()
  const router = useRouter()

  const handlePayment = async () => {
    setSubmitting(true)
    setErrorMessage(null)

    if (!state.shippingAddress || !state.paymentMethod) {
      setErrorMessage("Please fill all required fields")
      setSubmitting(false)
      return
    }

    try {
      const result = await completeCheckout({
        cartId: cart.id,
        email: state.email || "",
        shippingAddress: state.shippingAddress,
        billingAddress: state.billingAddress || state.shippingAddress,
        paymentMethod: state.paymentMethod,
        rewardsToApply: state.rewardsToApply,
        saveAddress: state.saveAddress,
      })

      if (!result.success) {
        setErrorMessage(result.error || "Order creation failed")
        setSubmitting(false)
        return
      }

      // For PayU, redirect to payment gateway by submitting a form
      if (result.paymentData?.payment_url && result.paymentData?.params) {
        const form = document.createElement("form")
        form.method = "POST"
        form.action = result.paymentData.payment_url

        Object.entries(result.paymentData.params).forEach(([key, value]) => {
          const input = document.createElement("input")
          input.type = "hidden"
          input.name = key
          input.value = String(value)
          form.appendChild(input)
        })

        document.body.appendChild(form)
        form.submit()
        return
      }

      // Fallback redirect if no payment data (shouldn't happen for PayU)
      router.push(`/order/confirmed/${result.orderId}`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Payment failed")
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button
        disabled={notReady || submitting || isPaymentUpdating}
        onClick={handlePayment}
        size="large"
        isLoading={submitting}
        className="w-full hover:bg-primary"
        data-testid={dataTestId}
      >
        Place order
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="payu-payment-error-message"
      />
    </>
  )
}

export default PaymentButton
