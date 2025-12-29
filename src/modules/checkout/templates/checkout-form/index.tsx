import { listCartOptions } from "@lib/data/cart"
import { Cart, CustomerProfile } from "@/lib/supabase/types"
import Addresses from "@modules/checkout/components/addresses"
import ShippingInfo from "@modules/checkout/components/shipping-info"

export default async function CheckoutForm({
  cart,
  customer,
}: {
  cart: Cart | null
  customer: CustomerProfile | null
}) {
  if (!cart) {
    return null
  }

  // Fetch available shipping options (Standard, Express, etc.)
  const shippingOptions = await listCartOptions()

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Shipping Address Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <Addresses
          cart={cart}
          customer={customer}
          availableShippingMethods={shippingOptions?.shipping_options ?? null}
        />
      </div>


      {/* Delivery Method Section - Display Only */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <ShippingInfo cart={cart} />
      </div>
    </div>
  )
}