import Checkbox from "@modules/common/components/checkbox"
import Input from "@modules/common/components/input"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useDebounce } from "@lib/hooks/use-debounce"
import AddressSelect from "../address-select"
import CountrySelect from "../country-select"
import { useCheckout } from "../../context/checkout-context"
import { getCustomerFacingEmail } from "@/lib/util/customer-email"
import { getCheckoutPhoneValue } from "@/lib/util/customer-phone"
import { Address, Cart, CustomerProfile } from "@/lib/supabase/types"

type ShippingFormData = {
  "shipping_address.first_name": string
  "shipping_address.last_name": string
  "shipping_address.address_1": string
  "shipping_address.company": string
  "shipping_address.postal_code": string
  "shipping_address.city": string
  "shipping_address.country_code": string
  "shipping_address.province": string
  "shipping_address.phone": string
  email: string
}

type ComparableAddress = Pick<
  Address,
  | "first_name"
  | "last_name"
  | "address_1"
  | "company"
  | "postal_code"
  | "city"
  | "country_code"
  | "province"
  | "phone"
>

function buildFormData(
  cart: Cart | null,
  customerPhone: string,
  customerEmail: string
): ShippingFormData {
  return {
    "shipping_address.first_name": cart?.shipping_address?.first_name || "",
    "shipping_address.last_name": cart?.shipping_address?.last_name || "",
    "shipping_address.address_1": cart?.shipping_address?.address_1 || "",
    "shipping_address.company": cart?.shipping_address?.company || "",
    "shipping_address.postal_code": cart?.shipping_address?.postal_code || "",
    "shipping_address.city": cart?.shipping_address?.city || "",
    "shipping_address.country_code": cart?.shipping_address?.country_code || "in",
    "shipping_address.province": cart?.shipping_address?.province || "",
    "shipping_address.phone": getCheckoutPhoneValue(
      cart?.shipping_address?.phone,
      customerPhone
    ),
    email: customerEmail,
  }
}

const ShippingAddress = ({
  customer,
  cart,
  checked,
  onChange,
}: {
  customer: CustomerProfile | null
  cart: Cart | null
  checked: boolean
  onChange: () => void
}) => {
  const { setEmail, setShippingAddress } = useCheckout()
  const customerFacingCartEmail = getCustomerFacingEmail(cart?.email)
  const customerPhone = getCheckoutPhoneValue(customer?.phone)
  const resolvedCheckoutEmail = customerFacingCartEmail || customer?.email || ""

  const [formData, setFormData] = useState<ShippingFormData>(() =>
    buildFormData(cart, customerPhone, resolvedCheckoutEmail)
  )

  // Removed local state: const [saveAddress, setSaveAddress] = useState(true)
  const {
    state: { saveAddress },
    setSaveAddress,
  } = useCheckout()

  const [pincodeLoading, setPincodeLoading] = useState(false)
  const debouncedPincode = useDebounce(
    formData["shipping_address.postal_code"],
    500
  )

  useEffect(() => {
    if (!/^[1-9][0-9]{5}$/.test(debouncedPincode)) return

    let cancelled = false
    setPincodeLoading(true)

    fetch(`/api/pincode/${debouncedPincode}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { city: string; state: string } | null) => {
        if (cancelled || !data) return
        setFormData((prev) => ({
          ...prev,
          "shipping_address.city": data.city,
          "shipping_address.province": data.state,
        }))
      })
      .finally(() => {
        if (!cancelled) setPincodeLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [debouncedPincode])

  const countriesInRegion = useMemo(
    () => cart?.region?.countries?.map((country) => country.iso_2),
    [cart?.region]
  )

  // check if customer has saved addresses that are in the current region
  const addressesInRegion = useMemo(
    () =>
      customer?.addresses.filter(
        (address) =>
          Boolean(address.country_code) &&
          (countriesInRegion?.includes(address.country_code!) ||
            address.country_code === "in")
      ),
    [customer?.addresses, countriesInRegion]
  )

  const setFormAddress = useCallback(
    (address?: Address, email?: string) => {
      if (address) {
        setFormData((prevState) => ({
          ...prevState,
          "shipping_address.first_name": address.first_name || "",
          "shipping_address.last_name": address.last_name || "",
          "shipping_address.address_1": address.address_1 || "",
          "shipping_address.company": address.company || "",
          "shipping_address.postal_code": address.postal_code || "",
          "shipping_address.city": address.city || "",
          "shipping_address.country_code": address.country_code || "in",
          "shipping_address.province": address.province || "",
          "shipping_address.phone": getCheckoutPhoneValue(
            address.phone,
            customerPhone
          ),
        }))
      }

      if (email) {
        setFormData((prevState) => ({
          ...prevState,
          email,
        }))
      }
    },
    [customerPhone]
  )

  useEffect(() => {
    if (cart?.shipping_address) {
      setFormAddress(cart.shipping_address, resolvedCheckoutEmail || undefined)
      return
    }

    setFormData((prevState) => ({
      ...prevState,
      "shipping_address.phone":
        prevState["shipping_address.phone"] || customerPhone,
      email: prevState.email || resolvedCheckoutEmail,
    }))
  }, [cart?.shipping_address, customerPhone, resolvedCheckoutEmail, setFormAddress])

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLInputElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const addressInput = useMemo<ComparableAddress>(
    () => ({
      first_name: formData["shipping_address.first_name"],
      last_name: formData["shipping_address.last_name"],
      address_1: formData["shipping_address.address_1"],
      company: formData["shipping_address.company"],
      postal_code: formData["shipping_address.postal_code"],
      city: formData["shipping_address.city"],
      country_code: formData["shipping_address.country_code"],
      province: formData["shipping_address.province"],
      phone: formData["shipping_address.phone"],
    }),
    [formData]
  )

  // Update checkout context whenever form data changes
  useEffect(() => {
    const address = {
      first_name: formData["shipping_address.first_name"],
      last_name: formData["shipping_address.last_name"],
      address_1: formData["shipping_address.address_1"],
      address_2: formData["shipping_address.company"] || null,
      city: formData["shipping_address.city"],
      province: formData["shipping_address.province"] || null,
      postal_code: formData["shipping_address.postal_code"],
      country_code: formData["shipping_address.country_code"],
      phone: formData["shipping_address.phone"] || null,
    }
    setShippingAddress(address)
  }, [formData, setShippingAddress])

  // Update email in checkout context
  useEffect(() => {
    if (formData.email) {
      setEmail(formData.email)
    }
  }, [formData.email, setEmail])

  return (
    <>
      {customer && (addressesInRegion?.length || 0) > 0 && (
        <div className="mb-4 sm:mb-6 flex flex-col gap-y-3 sm:gap-y-4 p-3 sm:p-5 border border-gray-200 rounded-lg">
          <p className="text-xs sm:text-sm">
            {`Hi ${customer.first_name}, do you want to use one of your saved addresses?`}
          </p>
          <AddressSelect
            addresses={customer.addresses}
            addressInput={addressInput}
            onSelect={setFormAddress}
          />
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Input
          label="First name"
          name="shipping_address.first_name"
          autoComplete="given-name"
          value={formData["shipping_address.first_name"] || ""}
          onChange={handleChange}
          required
          data-testid="shipping-first-name-input"
        />
        <Input
          label="Last name"
          name="shipping_address.last_name"
          autoComplete="family-name"
          value={formData["shipping_address.last_name"] || ""}
          onChange={handleChange}
          required
          data-testid="shipping-last-name-input"
        />
        <Input
          label="Address"
          name="shipping_address.address_1"
          autoComplete="address-line1"
          value={formData["shipping_address.address_1"] || ""}
          onChange={handleChange}
          required
          data-testid="shipping-address-input"
        />
        <Input
          label="Company"
          name="shipping_address.company"
          value={formData["shipping_address.company"] || ""}
          onChange={handleChange}
          autoComplete="organization"
          data-testid="shipping-company-input"
        />
        <Input
          label="Postal code"
          name="shipping_address.postal_code"
          autoComplete="postal-code"
          value={formData["shipping_address.postal_code"] || ""}
          onChange={handleChange}
          required
          data-testid="shipping-postal-code-input"
        />
        <Input
          label="City"
          name="shipping_address.city"
          autoComplete="address-level2"
          value={formData["shipping_address.city"] || ""}
          onChange={handleChange}
          required
          disabled={pincodeLoading}
          data-testid="shipping-city-input"
        />
        <CountrySelect
          name="shipping_address.country_code"
          autoComplete="country"
          region={cart?.region}
          value={formData["shipping_address.country_code"] || "in"}
          onChange={handleChange}
          required
          data-testid="shipping-country-select"
        />
        <Input
          label="State / Province"
          name="shipping_address.province"
          autoComplete="address-level1"
          value={formData["shipping_address.province"] || ""}
          onChange={handleChange}
          disabled={pincodeLoading}
          data-testid="shipping-province-input"
        />
      </div>
      <div className="my-6 sm:my-8">
        <Checkbox
          label="Billing address same as shipping address"
          name="same_as_billing"
          checked={checked}
          onChange={onChange}
          data-testid="billing-address-checkbox"
        />
      </div>
      {customer && (
        <div className="mb-6 sm:mb-8">
          <Checkbox
            label="Save address for future use"
            name="save_address"
            checked={saveAddress}
            onChange={() => setSaveAddress(!saveAddress)}
            data-testid="save-address-checkbox"
          />
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
        <Input
          label="Email"
          name="email"
          type="email"
          title="Enter a valid email address."
          autoComplete="email"
          value={formData.email || ""}
          onChange={handleChange}
          required
          data-testid="shipping-email-input"
        />
        <Input
          label="Phone"
          name="shipping_address.phone"
          autoComplete="tel"
          value={formData["shipping_address.phone"] || ""}
          onChange={handleChange}
          required
          data-testid="shipping-phone-input"
        />
      </div>
    </>
  )
}

export default ShippingAddress
