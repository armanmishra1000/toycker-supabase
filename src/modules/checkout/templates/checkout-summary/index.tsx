"use client"
import { useState } from "react"

import { Cart } from "@/lib/supabase/types"
import { Text } from "@modules/common/components/text"

import ItemsPreviewTemplate from "@modules/cart/templates/preview"
import DiscountCode from "@modules/checkout/components/discount-code"
import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import Payment from "@modules/checkout/components/payment"
import Review from "@modules/checkout/components/review"
import RewardsRedemption from "@modules/checkout/components/rewards-redemption"

type PaymentMethod = { id: string; name: string }

const CheckoutSummary = ({
  cart,
  paymentMethods
}: {
  cart: Cart
  paymentMethods: PaymentMethod[]
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | undefined>(
    cart?.payment_collection?.payment_sessions?.find((s) => s.status === "pending")?.provider_id
  )

  return (
    <div className="sticky top-4 flex flex-col gap-4">
      {/* Cart Summary Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <Text
          as="h2"
          weight="bold"
          className="flex flex-row text-xl items-baseline mb-4"
        >
          Order Summary
        </Text>
        <CartTotals totals={cart} cart={cart} />
        <Divider className="my-4" />
        <ItemsPreviewTemplate cart={cart} />
        <Divider className="my-4" />
        <RewardsRedemption cart={cart} />
        <DiscountCode cart={cart} />
      </div>

      {/* Payment Method Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <Payment
          cart={cart}
          availablePaymentMethods={paymentMethods}
          selectedPaymentMethod={selectedPaymentMethod}
          onPaymentMethodChange={setSelectedPaymentMethod}
        />
      </div>

      {/* Place Order Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <Review cart={cart} selectedPaymentMethod={selectedPaymentMethod} />
      </div>
    </div>
  )
}

export default CheckoutSummary