import { listCartPaymentMethods } from "@lib/data/payment"
import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import Breadcrumbs from "@modules/common/components/breadcrumbs"
import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Checkout",
}

import { CheckoutProvider } from "@modules/checkout/context/checkout-context"

export default async function Checkout() {
  const customer = await retrieveCustomer()

  // Require login for checkout
  if (!customer) {
    redirect(`/login?returnUrl=${encodeURIComponent("/checkout?step=address")}`)
  }

  let cart = await retrieveCart()

  if (!cart) {
    return notFound()
  }

  // Auto-select standard shipping if none selected
  // This ensures shipping price is shown in the summary (₹40 or FREE)
  if (!cart.shipping_methods || cart.shipping_methods.length === 0) {
    const { autoSelectStandardShipping } = await import("@lib/data/cart")
    const methodData = await autoSelectStandardShipping(cart.id, true)
    if (methodData) {
      cart.shipping_methods = [methodData as any]
      // Trigger a re-calculation of totals if needed, but since we are in RSC, 
      // we'll rely on the provider/summary to handle the math based on this cart object.
    }
  }

  // Fetch payment methods at page level for right column
  const paymentMethods = await listCartPaymentMethods(cart.region_id ?? "")

  return (
    <CheckoutProvider cart={cart}>
      <div className="content-container px-4 py-6 sm:px-6 sm:py-8">
        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 sm:mb-6">Checkout</h1>

        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: "Cart", href: "/cart" },
            { label: "Checkout" },
          ]}
          className="mb-6 sm:mb-8"
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_420px] gap-4 sm:gap-6">
          {/* Left Column: Shipping Address + Payment Method */}
          <div className="w-full">
            <CheckoutForm
              cart={cart}
              customer={customer}
              paymentMethods={paymentMethods ?? []}
            />
          </div>

          {/* Right Column: Order Summary + Complete Order */}
          <div className="w-full">
            <PaymentWrapper cart={cart}>
              <CheckoutSummary cart={cart} />
            </PaymentWrapper>
          </div>
        </div>
      </div>
    </CheckoutProvider>
  )
}