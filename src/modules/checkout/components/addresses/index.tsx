"use client"

import { saveAddressesBackground } from "@lib/data/cart"
import compareAddresses from "@lib/util/compare-addresses"
import React, { useCallback, useRef } from "react"
import { Text } from "@modules/common/components/text"
import { Cart, CustomerProfile, ShippingOption } from "@/lib/supabase/types"
import { useActionState, useTransition } from "react"
import { CheckCircle, Loader2 } from "lucide-react"
import BillingAddress from "../billing_address"
import ErrorMessage from "../error-message"
import ShippingAddress from "../shipping-address"

const Addresses = ({
  cart,
  customer,
}: {
  cart: Cart
  customer: CustomerProfile | null
  availableShippingMethods?: ShippingOption[] | null
}) => {
  const formRef = useRef<HTMLFormElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isPending, startTransition] = useTransition()

  const [sameAsBilling, setSameAsBilling] = React.useState(
    cart?.shipping_address && cart?.billing_address
      ? compareAddresses(cart?.shipping_address, cart?.billing_address)
      : true
  )
  const toggleSameAsBilling = () => setSameAsBilling(!sameAsBilling)

  const [message, formAction] = useActionState(saveAddressesBackground, null)

  // Check if address is already saved
  const addressSaved = Boolean(cart?.shipping_address?.address_1)

  // Auto-save on blur with debounce
  const handleAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (formRef.current) {
        const formData = new FormData(formRef.current)
        // Only save if minimum required fields are filled
        const firstName = formData.get("shipping_address.first_name")
        const address1 = formData.get("shipping_address.address_1")
        const city = formData.get("shipping_address.city")
        const postalCode = formData.get("shipping_address.postal_code")

        if (firstName && address1 && city && postalCode) {
          startTransition(() => {
            formAction(formData)
          })
        }
      }
    }, 800) // 800ms debounce
  }, [formAction])

  return (
    <div>
      <div className="flex flex-row items-center justify-between mb-4">
        <Text
          as="h2"
          weight="bold"
          className="text-3xl flex items-center gap-2"
        >
          Shipping Address
          {isPending ? (
            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
          ) : addressSaved ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : null}
        </Text>
      </div>

      <form ref={formRef} action={formAction} onBlur={handleAutoSave}>
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

      </form>
    </div>
  )
}

export default Addresses
