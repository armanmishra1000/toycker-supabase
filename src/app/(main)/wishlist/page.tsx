import { Metadata } from "next"
import { retrieveCustomer } from "@lib/data/customer"
import WishlistPageTemplate from "@modules/wishlist/templates/wishlist-page"
import { getClubSettings } from "@lib/data/club"
import { getWishlistItems } from "@lib/data/wishlist"

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
  const [customer, clubSettings, wishlistItems] = await Promise.all([
    retrieveCustomer(),
    getClubSettings(),
    getWishlistItems(),
  ])

  const isCustomerLoggedIn = Boolean(customer)
  const customerName = customer?.first_name ?? customer?.email ?? "Friend"
  const loginPath = buildLoginRedirect()
  const clubDiscountPercentage = clubSettings?.discount_percentage

  return (
    <WishlistPageTemplate
      countryCode="in"
      customerName={customerName}
      loginPath={loginPath}
      isCustomerLoggedIn={isCustomerLoggedIn}
      clubDiscountPercentage={clubDiscountPercentage}
      initialItems={wishlistItems}
    />
  )
}