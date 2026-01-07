import WishlistContent from "@modules/wishlist/components/wishlist-content"

type WishlistPageClientProps = {
  countryCode: string
  loginPath: string
  isCustomerLoggedIn: boolean
  clubDiscountPercentage?: number
  initialItems?: string[]
}

const WishlistPageClient = ({
  countryCode,
  clubDiscountPercentage,
}: WishlistPageClientProps) => {
  return (
    <WishlistContent
      countryCode={countryCode}
      clubDiscountPercentage={clubDiscountPercentage}
    />
  )
}

export default WishlistPageClient
