"use client"

import { Cart } from "@/lib/supabase/types"
import { Text } from "@modules/common/components/text"
import { Lock, AlertCircle } from "lucide-react"

import PaymentButton from "../payment-button"
import { useCheckout } from "../../context/checkout-context"

// Extended cart type with gift_cards property
type CartWithGiftCards = Cart & {
  gift_cards?: Array<{ id: string }>
}

const Review = ({ cart }: { cart: CartWithGiftCards }) => {
  const { state } = useCheckout()
  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && (cart?.total ?? 0) === 0

  // Check if all required steps are completed using local state
  const hasAddress = state.isValid || (state.shippingAddress && state.shippingAddress.address_1)
  const hasShipping = Boolean(cart.shipping_methods?.length) || true // Assuming default shipping
  const hasPayment = Boolean(state.paymentMethod) || paidByGiftcard

  const isReady = hasAddress && hasShipping && hasPayment

  // Generate error messages
  const errors = []
  if (!hasAddress) errors.push("shipping address")
  // if (!hasShipping) errors.push("delivery method")
  if (!hasPayment) errors.push("payment method")

  return (
    <div className="space-y-4">
      {/* Security Badge */}
      <div className="w-full flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
        <Lock size={16} className="text-green-600" />
        <span className="text-xs font-medium text-green-700">
          Secure checkout - Your information is protected
        </span>
      </div>

      {/* Terms & Conditions */}
      <div className="text-xs text-gray-500 leading-relaxed">
        By placing this order, you agree to our{" "}
        <a href="/policies/terms" className="text-blue-600 hover:underline">Terms of Service</a>
        {" "}and{" "}
        <a href="/policies/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.
      </div>

      {/* Error Messages */}
      {!isReady && (
        <div className="w-full flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <span className="font-medium">Please complete:</span>{" "}
            {errors.join(", ")}
          </div>
        </div>
      )}

      <PaymentButton cart={cart} data-testid="submit-order-button" />
    </div>
  )
}

export default Review