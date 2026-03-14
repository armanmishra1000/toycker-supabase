"use client"

import { useActionState, useEffect, useState } from "react"
import { PencilSquareIcon } from "@heroicons/react/24/outline"

import { updateOrderShippingAddress } from "@/lib/data/admin"
import { Address, Region } from "@/lib/supabase/types"
import CountrySelect from "@modules/checkout/components/country-select"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import Modal from "@modules/common/components/modal"
import { Button } from "@modules/common/components/button"

type EditOrderShippingAddressModalProps = {
  orderId: string
  address: Address | null
  region: Region
}

const initialState = {
  success: false,
  error: null,
}

export default function EditOrderShippingAddressModal({
  orderId,
  address,
  region,
}: EditOrderShippingAddressModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [formState, formAction] = useActionState(
    updateOrderShippingAddress,
    initialState
  )

  useEffect(() => {
    if (formState.success) {
      setIsOpen(false)
    }
  }, [formState.success])

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 transition-colors hover:bg-indigo-100"
        data-testid="edit-order-shipping-address-button"
      >
        <PencilSquareIcon className="h-4 w-4" />
        Edit Shipping Address
      </button>

      <Modal isOpen={isOpen} close={() => setIsOpen(false)}>
        <Modal.Title>
          <span className="text-xl font-black text-slate-900">
            Edit Shipping Address
          </span>
        </Modal.Title>

        <form action={formAction}>
          <input type="hidden" name="orderId" value={orderId} />

          <Modal.Body>
            <div className="grid grid-cols-1 gap-y-2">
              <div className="grid grid-cols-2 gap-x-2">
                <Input
                  label="First name"
                  name="first_name"
                  required
                  autoComplete="given-name"
                  defaultValue={address?.first_name || ""}
                />
                <Input
                  label="Last name"
                  name="last_name"
                  required
                  autoComplete="family-name"
                  defaultValue={address?.last_name || ""}
                />
              </div>

              <Input
                label="Company"
                name="company"
                autoComplete="organization"
                defaultValue={address?.company || ""}
              />

              <Input
                label="Address"
                name="address_1"
                required
                autoComplete="address-line1"
                defaultValue={address?.address_1 || ""}
              />

              <Input
                label="Apartment, suite, etc."
                name="address_2"
                autoComplete="address-line2"
                defaultValue={address?.address_2 || ""}
              />

              <div className="grid grid-cols-[144px_1fr] gap-x-2">
                <Input
                  label="Postal code"
                  name="postal_code"
                  required
                  autoComplete="postal-code"
                  defaultValue={address?.postal_code || ""}
                />
                <Input
                  label="City"
                  name="city"
                  required
                  autoComplete="address-level2"
                  defaultValue={address?.city || ""}
                />
              </div>

              <Input
                label="Province / State"
                name="province"
                autoComplete="address-level1"
                defaultValue={address?.province || ""}
              />

              <CountrySelect
                name="country_code"
                region={region}
                required
                autoComplete="country"
                defaultValue={address?.country_code || "in"}
              />

              <Input
                label="Delivery phone"
                name="phone"
                required
                autoComplete="tel"
                defaultValue={address?.phone || ""}
              />
            </div>

            {formState.error && (
              <div
                className="py-3 text-sm font-medium text-red-600"
                data-testid="edit-order-shipping-address-error"
              >
                {formState.error}
              </div>
            )}
          </Modal.Body>

          <Modal.Footer>
            <div className="mt-6 flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsOpen(false)}
                className="h-10 w-full sm:w-auto"
              >
                Cancel
              </Button>
              <SubmitButton
                size="base"
                className="h-10 w-full sm:w-auto"
                data-testid="save-order-shipping-address-button"
              >
                Save Shipping Address
              </SubmitButton>
            </div>
          </Modal.Footer>
        </form>
      </Modal>
    </>
  )
}
