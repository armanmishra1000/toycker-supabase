import { listCartPaymentMethods } from "@lib/data/payment"
import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Checkout",
}

export default async function Checkout() {
  const cart = await retrieveCart()

  if (!cart) {
    return notFound()
  }

  const customer = await retrieveCustomer()

  // Require login for checkout
  if (!customer) {
    redirect(`/login?returnUrl=${encodeURIComponent('/checkout?step=address')}`)
  }

  // Fetch payment methods at page level for right column
  const paymentMethods = await listCartPaymentMethods(cart.region_id ?? "")

  return (
    <div className="content-container py-8">
      <div className="grid grid-cols-1 small:grid-cols-[1fr_380px] gap-6">
        {/* Left Column: Address + Shipping */}
        <div className="w-full">
          <CheckoutForm cart={cart} customer={customer} />
        </div>

        {/* Right Column: Cart Summary + Payment + Place Order */}
        <div className="w-full">
          <PaymentWrapper cart={cart}>
            <CheckoutSummary
              cart={cart}
              paymentMethods={paymentMethods ?? []}
            />
          </PaymentWrapper>
        </div>
      </div>
    </div>
  )
}