"use client"

import { MouseEvent } from "react"

import { Heart } from "lucide-react"

import { useOptionalWishlist } from "@modules/products/context/wishlist"

type WishlistButtonProps = {
  productId: string
  productTitle: string
}

const WishlistButton = ({ productId, productTitle }: WishlistButtonProps) => {
  const wishlist = useOptionalWishlist()

  if (!wishlist) {
    return null
  }

  const { isInWishlist, toggleWishlist } = wishlist
  const isActive = isInWishlist(productId)

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    toggleWishlist(productId)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isActive}
      aria-label={isActive ? `Remove ${productTitle} from wishlist` : `Add ${productTitle} to wishlist`}
      className="rounded-full bg-white/90 p-2 text-ui-fg-muted transition hover:text-ui-fg-base w-10 h-10 flex justify-center items-center"
    >
      <Heart
        className="h-4 w-4"
        aria-hidden
        fill={isActive ? "currentColor" : "none"}
      />
    </button>
  )
}

export default WishlistButton
