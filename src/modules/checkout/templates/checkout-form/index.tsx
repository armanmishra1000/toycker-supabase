import { listCartOptions } from "@lib/data/cart"
import { Cart, CustomerProfile } from "@/lib/supabase/types"
import Addresses from "@modules/checkout/components/addresses"
import Payment from "@modules/checkout/components/payment"

export default async function CheckoutForm({
  cart,
  customer,
  paymentMethods,
}: {
  cart: Cart | null
  customer: CustomerProfile | null
  paymentMethods: { id: string; name: string }[]
}) {
  if (!cart) {
    return null
  }

  // Fetch available shipping options (Standard, Express, etc.)
  const shippingOptions = await listCartOptions()

  return (
    <div className="w-full flex flex-col gap-4 sm:gap-6">
      {/* Shipping Address Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
        <Addresses
          cart={cart}
          customer={customer}
          availableShippingMethods={shippingOptions?.shipping_options ?? null}
        />
      </div>

      {/* Delivery Method Section - Hidden as requested, auto-select logic remains in background */}
      {/* <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <ShippingInfo cart={cart} />
      </div> */}

      {/* Payment Method Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
        <Payment
          cart={cart}
          availablePaymentMethods={paymentMethods}
        />
      </div>
    </div>
  )
}