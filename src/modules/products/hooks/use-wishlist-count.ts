"use client"

import { useEffect, useState } from "react"
import { useOptionalWishlist } from "@modules/products/context/wishlist"

const STORAGE_KEY = "toycker_wishlist"

const readCount = () => {
  if (typeof window === "undefined") {
    return 0
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return 0
    }
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.filter((value) => typeof value === "string").length
    }
    return 0
  } catch {
    return 0
  }
}

export const useWishlistCount = () => {
  const wishlist = useOptionalWishlist()
  const [localCount, setLocalCount] = useState(() => readCount())

  useEffect(() => {
    if (!wishlist) {
      setLocalCount(readCount())
    }
  }, [wishlist])

  // If we have the global wishlist context, use its length.
  // This is the source of truth for both logged-in and guest users.
  if (wishlist) {
    return wishlist.items.length
  }

  // Fallback for cases where WishlistProvider is not yet active (rare in global setup)
  return localCount
}

export default useWishlistCount
