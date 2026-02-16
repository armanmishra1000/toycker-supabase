"use client"

import React, { useEffect, useState, useActionState } from "react"
import { Pencil as Edit, Trash2 as Trash, MapPin } from "lucide-react"
import { Button } from "@modules/common/components/button"
import { Text } from "@modules/common/components/text"
import { cn } from "@lib/util/cn"

import useToggleState from "@lib/hooks/use-toggle-state"
import CountrySelect from "@modules/checkout/components/country-select"
import Input from "@modules/common/components/input"
import Modal from "@modules/common/components/modal"
import Spinner from "@modules/common/icons/spinner"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import {
  deleteAdminCustomerAddress,
  updateAdminCustomerAddress,
} from "@lib/data/admin"
import { Address, Region } from "@/lib/supabase/types"

type EditAddressProps = {
  region: Region
  address: Address
}

const EditAddressModal: React.FC<EditAddressProps> = ({ region, address }) => {
  const [removing, setRemoving] = useState(false)
  const [successState, setSuccessState] = useState(false)
  const { state, open, close: closeModal } = useToggleState(false)

  const [formState, formAction] = useActionState(updateAdminCustomerAddress, {
    success: false,
    error: null,
  })

  const close = () => {
    setSuccessState(false)
    closeModal()
  }

  useEffect(() => {
    if (successState) {
      close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successState])

  useEffect(() => {
    if (formState.success) {
      setSuccessState(true)
    }
  }, [formState])

  const removeAddress = async () => {
    if (!address.id) return
    if (!confirm("Are you sure you want to delete this address?")) return

    setRemoving(true)
    try {
      await deleteAdminCustomerAddress(address.id)
    } catch (e) {
      console.error(e)
      alert("Failed to delete address")
    } finally {
      setRemoving(false)
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all group relative">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Address
            </span>
          </div>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-900"
              onClick={open}
              title="Edit Address"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-600"
              onClick={removeAddress}
              title="Delete Address"
              disabled={removing}
            >
              {removing ? <Spinner size={16} /> : <Trash className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1 text-sm text-gray-700">
          <p className="font-semibold text-gray-900">
            {address.first_name} {address.last_name}
          </p>
          {address.company && (
            <p className="text-gray-500">{address.company}</p>
          )}
          <p>{address.address_1}</p>
          {address.address_2 && <p>{address.address_2}</p>}
          <p>
            {address.city}, {address.province} {address.postal_code}
          </p>
          <p>{address.country_code?.toUpperCase()}</p>
          {address.phone && (
            <p className="pt-2 text-gray-500 flex items-center gap-2 text-xs">
              <span className="text-gray-400">Phone:</span> {address.phone}
            </p>
          )}
        </div>
      </div>

      <Modal isOpen={state} close={close}>
        <Modal.Title>
          <Text weight="bold" className="text-xl mb-2">
            Edit address
          </Text>
        </Modal.Title>
        <form action={formAction}>
          <input type="hidden" name="addressId" value={address.id} />
          <Modal.Body>
            <div className="grid grid-cols-1 gap-y-2">
              <div className="grid grid-cols-2 gap-x-2">
                <Input
                  label="First name"
                  name="first_name"
                  required
                  autoComplete="given-name"
                  defaultValue={address.first_name || ""}
                />
                <Input
                  label="Last name"
                  name="last_name"
                  required
                  autoComplete="family-name"
                  defaultValue={address.last_name || ""}
                />
              </div>
              <Input
                label="Company"
                name="company"
                autoComplete="organization"
                defaultValue={address.company || ""}
              />
              <Input
                label="Address"
                name="address_1"
                required
                autoComplete="address-line1"
                defaultValue={address.address_1 || ""}
              />
              <Input
                label="Apartment, suite, etc."
                name="address_2"
                autoComplete="address-line2"
                defaultValue={address.address_2 || ""}
              />
              <div className="grid grid-cols-[144px_1fr] gap-x-2">
                <Input
                  label="Postal code"
                  name="postal_code"
                  required
                  autoComplete="postal-code"
                  defaultValue={address.postal_code || ""}
                />
                <Input
                  label="City"
                  name="city"
                  required
                  autoComplete="locality"
                  defaultValue={address.city || ""}
                />
              </div>
              <Input
                label="Province / State"
                name="province"
                autoComplete="address-level1"
                defaultValue={address.province || ""}
              />
              <CountrySelect
                name="country_code"
                region={region}
                required
                autoComplete="country"
                defaultValue={address.country_code || ""}
              />
              <Input
                label="Phone"
                name="phone"
                autoComplete="phone"
                defaultValue={address.phone || ""}
              />
            </div>
            {formState.error && (
              <div className="text-red-500 text-sm py-2">{formState.error}</div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <div className="flex gap-3 mt-6">
              <Button
                type="reset"
                variant="secondary"
                onClick={close}
                className="h-10 w-full sm:w-auto"
              >
                Cancel
              </Button>
              <SubmitButton size="base" className="h-10 w-full sm:w-auto">
                Save
              </SubmitButton>
            </div>
          </Modal.Footer>
        </form>
      </Modal>
    </>
  )
}

export default EditAddressModal
