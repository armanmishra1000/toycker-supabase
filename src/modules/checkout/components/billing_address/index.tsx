import { Cart } from "@/lib/supabase/types"
import Input from "@modules/common/components/input"
import React, { useState, useEffect } from "react"
import { useDebounce } from "@lib/hooks/use-debounce"
import CountrySelect from "../country-select"
import { useCheckout } from "../../context/checkout-context"

const BillingAddress = ({ cart }: { cart: Cart | null }) => {
  const { setBillingAddress } = useCheckout()

  const [formData, setFormData] = useState<Record<string, string>>({
    "billing_address.first_name": cart?.billing_address?.first_name || "",
    "billing_address.last_name": cart?.billing_address?.last_name || "",
    "billing_address.address_1": cart?.billing_address?.address_1 || "",
    "billing_address.company": cart?.billing_address?.company || "",
    "billing_address.postal_code": cart?.billing_address?.postal_code || "",
    "billing_address.city": cart?.billing_address?.city || "",
    "billing_address.country_code": cart?.billing_address?.country_code || "",
    "billing_address.province": cart?.billing_address?.province || "",
    "billing_address.phone": cart?.billing_address?.phone || "",
  })

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

  const [pincodeLoading, setPincodeLoading] = useState(false)
  const debouncedPincode = useDebounce(
    formData["billing_address.postal_code"],
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
          "billing_address.city": data.city,
          "billing_address.province": data.state,
        }))
      })
      .finally(() => {
        if (!cancelled) setPincodeLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [debouncedPincode])

  // Update checkout context whenever form data changes
  useEffect(() => {
    const address = {
      first_name: formData["billing_address.first_name"],
      last_name: formData["billing_address.last_name"],
      address_1: formData["billing_address.address_1"],
      address_2: formData["billing_address.company"] || null,
      city: formData["billing_address.city"],
      province: formData["billing_address.province"] || null,
      postal_code: formData["billing_address.postal_code"],
      country_code: formData["billing_address.country_code"],
      phone: formData["billing_address.phone"] || null,
    }
    setBillingAddress(address)
  }, [formData, setBillingAddress])

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Input
          label="First name"
          name="billing_address.first_name"
          autoComplete="given-name"
          value={formData["billing_address.first_name"] || ""}
          onChange={handleChange}
          required
          data-testid="billing-first-name-input"
        />
        <Input
          label="Last name"
          name="billing_address.last_name"
          autoComplete="family-name"
          value={formData["billing_address.last_name"] || ""}
          onChange={handleChange}
          required
          data-testid="billing-last-name-input"
        />
        <Input
          label="Address"
          name="billing_address.address_1"
          autoComplete="address-line1"
          value={formData["billing_address.address_1"] || ""}
          onChange={handleChange}
          required
          data-testid="billing-address-input"
        />
        <Input
          label="Company"
          name="billing_address.company"
          value={formData["billing_address.company"] || ""}
          onChange={handleChange}
          autoComplete="organization"
          data-testid="billing-company-input"
        />
        <Input
          label="Postal code"
          name="billing_address.postal_code"
          autoComplete="postal-code"
          value={formData["billing_address.postal_code"] || ""}
          onChange={handleChange}
          required
          data-testid="billing-postal-input"
        />
        <Input
          label="City"
          name="billing_address.city"
          autoComplete="address-level2"
          value={formData["billing_address.city"] || ""}
          onChange={handleChange}
          disabled={pincodeLoading}
        />
        <CountrySelect
          name="billing_address.country_code"
          autoComplete="country"
          region={cart?.region}
          value={formData["billing_address.country_code"] || "in"}
          onChange={handleChange}
          required
          data-testid="billing-country-select"
        />
        <Input
          label="State / Province"
          name="billing_address.province"
          autoComplete="address-level1"
          value={formData["billing_address.province"] || ""}
          onChange={handleChange}
          disabled={pincodeLoading}
          data-testid="billing-province-input"
        />
        <Input
          label="Phone"
          name="billing_address.phone"
          autoComplete="tel"
          value={formData["billing_address.phone"] || ""}
          onChange={handleChange}
          required
          data-testid="billing-phone-input"
        />
      </div>
    </>
  )
}

export default BillingAddress