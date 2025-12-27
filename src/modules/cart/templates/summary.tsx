"use client"

import { Button } from "@modules/common/components/button"
import { Text } from "@modules/common/components/text"

import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import DiscountCode from "@modules/checkout/components/discount-code"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Cart } from "@/lib/supabase/types"

type SummaryProps = {
  cart: Cart
}

function getCheckoutStep(cart: Cart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  } else if (!cart.shipping_method) {
    return "delivery"
  } else {
    return "payment"
  }
}

const Summary = ({ cart }: SummaryProps) => {
  const step = getCheckoutStep(cart)

  return (
    <div className="flex flex-col gap-y-4">
      <Text as="h2" weight="bold" className="text-[2rem] leading-[2.75rem]">
        Summary
      </Text>
      <DiscountCode cart={cart} />
      <Divider />
      <CartTotals totals={cart} />
      <LocalizedClientLink
        href={"/checkout?step=" + step}
        data-testid="checkout-button"
      >
        <Button className="w-full h-10">Go to checkout</Button>
      </LocalizedClientLink>
    </div>
  )
}

export default Summary