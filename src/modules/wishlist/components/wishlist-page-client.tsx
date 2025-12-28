"use client"

import { WishlistProvider } from "@modules/products/context/wishlist"
import WishlistContent from "@modules/wishlist/components/wishlist-content"

type WishlistPageClientProps = {
  countryCode: string
  loginPath: string
  isCustomerLoggedIn: boolean
  clubDiscountPercentage?: number
}

const WishlistPageClient = ({ countryCode, loginPath, isCustomerLoggedIn, clubDiscountPercentage }: WishlistPageClientProps) => {
  return (
    <WishlistProvider
      isAuthenticated={isCustomerLoggedIn}
      loginPath={loginPath}
    >
      <WishlistContent
        countryCode={countryCode}
        clubDiscountPercentage={clubDiscountPercentage}
      />
    </WishlistProvider>
  )
}

export default WishlistPageClient
