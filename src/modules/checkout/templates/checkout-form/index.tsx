import { listCartOptions } from "@lib/data/cart"
import { listCartPaymentMethods } from "@lib/data/payment"
import { Cart, CustomerProfile } from "@/lib/supabase/types"
import Addresses from "@modules/checkout/components/addresses"
import Shipping from "@modules/checkout/components/shipping"
import Payment from "@modules/checkout/components/payment"
import Review from "@modules/checkout/components/review"

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

  // Fetch available payment methods from the database
  const paymentMethods = await listCartPaymentMethods(cart.region_id ?? "")

  if (!paymentMethods) {
    return null
  }

  // Fetch available shipping options (Standard, Express, etc.)
  const shippingOptions = await listCartOptions()

  return (
    <div className="w-full grid grid-cols-1 gap-y-8">
      <Addresses 
        cart={cart} 
        customer={customer} 
        availableShippingMethods={shippingOptions?.shipping_options ?? null} 
      />

      <Shipping 
        cart={cart} 
        availableShippingMethods={shippingOptions?.shipping_options ?? null} 
      />

      <Payment 
        cart={cart} 
        availablePaymentMethods={paymentMethods} 
      />

      <Review cart={cart} />
    </div>
  )
}