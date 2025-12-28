"use client"

import { Cart } from "@/lib/supabase/types"
import { Text } from "@modules/common/components/text"

import PaymentButton from "../payment-button"

// Extended cart type with gift_cards property
type CartWithGiftCards = Cart & {
  gift_cards?: Array<{ id: string }>
}

const Review = ({ cart }: { cart: CartWithGiftCards }) => {
  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && (cart?.total ?? 0) === 0

  // Check if all required steps are completed
  const hasAddress = Boolean(cart.shipping_address?.address_1)
  const hasShipping = Boolean(cart.shipping_methods?.length)
  const hasPayment = Boolean(cart.payment_collection?.payment_sessions?.length) || paidByGiftcard

  const isReady = hasAddress && hasShipping && hasPayment

  return (
    <div className="bg-white pt-4">
      <div className="flex flex-row items-center justify-between mb-6">
        <h2 className="flex flex-row text-3xl font-bold gap-x-2 items-baseline">
          Complete Order
        </h2>
      </div>

      <div className="flex items-start gap-x-1 w-full mb-6">
        <div className="w-full">
          <Text className="text-sm text-gray-500 mb-4">
            By clicking the button below, you confirm that you have
            read, understand and accept our Terms of Use, Terms of Sale and
            Returns Policy and acknowledge that you have read Toycker Store&apos;s Privacy Policy.
          </Text>

          {!isReady && (
            <Text className="text-sm text-amber-600 mb-4">
              {!hasAddress && "Please fill in your shipping address. "}
              {!hasShipping && "Please select a delivery method. "}
              {!hasPayment && "Please select a payment method."}
            </Text>
          )}
        </div>
      </div>

      <PaymentButton cart={cart} data-testid="submit-order-button" />
    </div>
  )
}

export default Review