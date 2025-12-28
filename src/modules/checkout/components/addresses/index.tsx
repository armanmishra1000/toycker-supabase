"use client"

import { setAddresses } from "@lib/data/cart"
import compareAddresses from "@lib/util/compare-addresses"
import React from "react"
import { Text } from "@modules/common/components/text"
import { Cart, CustomerProfile, ShippingOption } from "@/lib/supabase/types"
import { useActionState } from "react"
import { CheckCircle } from "lucide-react"
import BillingAddress from "../billing_address"
import ErrorMessage from "../error-message"
import ShippingAddress from "../shipping-address"
import { SubmitButton } from "../submit-button"

const Addresses = ({
  cart,
  customer,
}: {
  cart: Cart
  customer: CustomerProfile | null
  availableShippingMethods?: ShippingOption[] | null
}) => {
  const [sameAsBilling, setSameAsBilling] = React.useState(
    cart?.shipping_address && cart?.billing_address
      ? compareAddresses(cart?.shipping_address, cart?.billing_address)
      : true
  )
  const toggleSameAsBilling = () => setSameAsBilling(!sameAsBilling)

  const [message, formAction] = useActionState(setAddresses, null)

  // Check if address is already saved
  const addressSaved = Boolean(cart?.shipping_address?.address_1)

  return (
    <div>
      <div className="flex flex-row items-center justify-between mb-4">
        <Text
          as="h2"
          weight="bold"
          className="text-xl flex items-center gap-2"
        >
          Shipping Address
          {addressSaved && <CheckCircle className="h-5 w-5 text-green-500" />}
        </Text>
      </div>

      <form action={formAction}>
        <ShippingAddress
          customer={customer}
          checked={sameAsBilling}
          onChange={toggleSameAsBilling}
          cart={cart}
        />

        {!sameAsBilling && (
          <div className="mt-6">
            <Text
              as="h2"
              weight="bold"
              className="text-xl mb-4"
            >
              Billing Address
            </Text>
            <BillingAddress cart={cart} />
          </div>
        )}

        <input type="hidden" name="auto_save" value="true" />

        <ErrorMessage error={message?.message ?? null} data-testid="address-error-message" />

        <SubmitButton
          className="mt-4 w-full"
          data-testid="save-address-button"
        >
          {addressSaved ? "Update Address" : "Save Address"}
        </SubmitButton>
      </form>
    </div>
  )
}

export default Addresses
