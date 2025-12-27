import { Metadata } from "next"
import { retrieveCustomer } from "@lib/data/customer"
import WishlistPageTemplate from "@modules/wishlist/templates/wishlist-page"

export const metadata: Metadata = {
  title: "Wishlist",
  description: "Review and manage your saved products.",
}

const buildLoginRedirect = () => {
  const loginPath = `/account`
  const wishlistPath = `/wishlist`
  return `${loginPath}?redirect=${encodeURIComponent(wishlistPath)}`
}

export default async function WishlistPage() {
  const customer = await retrieveCustomer()

  const isCustomerLoggedIn = Boolean(customer)
  const customerName = customer?.first_name ?? customer?.email ?? "Friend"
  const loginPath = buildLoginRedirect()

  return (
    <WishlistPageTemplate
      countryCode="in"
      customerName={customerName}
      loginPath={loginPath}
      isCustomerLoggedIn={isCustomerLoggedIn}
    />
  )
}