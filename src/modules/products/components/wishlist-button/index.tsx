import { MouseEvent, useState } from "react"
import { Heart, Loader2 } from "lucide-react"
import { useOptionalWishlist } from "@modules/products/context/wishlist"

type WishlistButtonProps = {
  productId: string
  productTitle: string
}

const WishlistButton = ({ productId, productTitle }: WishlistButtonProps) => {
  const wishlist = useOptionalWishlist()
  const [isPending, setIsPending] = useState(false)

  if (!wishlist) {
    return null
  }

  const { isInWishlist, toggleWishlist } = wishlist
  const isActive = isInWishlist(productId)

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    if (isPending) return

    setIsPending(true)
    try {
      await toggleWishlist(productId)
    } catch (error) {
      // Error handled by context rollback/logging, but we catch to ensure pending is reset
    } finally {
      setIsPending(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={isActive}
      aria-label={isActive ? `Remove ${productTitle} from wishlist` : `Add ${productTitle} to wishlist`}
      className="rounded-full bg-white/90 p-2 text-ui-fg-muted transition hover:text-ui-fg-base w-10 h-10 flex justify-center items-center shadow-sm disabled:cursor-not-allowed"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
      ) : (
        <Heart
          className={`h-4 w-4 transition-colors duration-200 ${isActive ? "fill-[#E7353A] text-[#E7353A]" : ""
            }`}
          aria-hidden
        />
      )}
    </button>
  )
}

export default WishlistButton
