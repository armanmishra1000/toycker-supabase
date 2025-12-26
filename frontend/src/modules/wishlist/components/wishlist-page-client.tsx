"use client"

import { WishlistProvider } from "@modules/products/context/wishlist"
import WishlistContent from "@modules/wishlist/components/wishlist-content"

type WishlistPageClientProps = {
  countryCode: string
  loginPath: string
  isCustomerLoggedIn: boolean
}

const WishlistPageClient = ({ countryCode, loginPath, isCustomerLoggedIn }: WishlistPageClientProps) => {
  return (
    <WishlistProvider
      isAuthenticated={isCustomerLoggedIn}
      loginPath={loginPath}
    >
      <WishlistContent countryCode={countryCode} />
    </WishlistProvider>
  )
}

export default WishlistPageClient
