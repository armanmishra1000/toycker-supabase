"use client"

import { useEffect, useState } from "react"

import { WISHLIST_UPDATED_EVENT } from "@modules/products/context/wishlist"

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
  const [count, setCount] = useState(() => readCount())

  useEffect(() => {
    setCount(readCount())
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const handleUpdate = (event: Event) => {
      if ((event as CustomEvent<{ count?: number }>).detail?.count !== undefined) {
        setCount((event as CustomEvent<{ count: number }>).detail.count)
      } else {
        setCount(readCount())
      }
    }

    const handleStorage = (storageEvent: StorageEvent) => {
      if (!storageEvent.key || storageEvent.key === STORAGE_KEY) {
        setCount(readCount())
      }
    }

    window.addEventListener(WISHLIST_UPDATED_EVENT, handleUpdate as EventListener)
    window.addEventListener("storage", handleStorage)

    return () => {
      window.removeEventListener(WISHLIST_UPDATED_EVENT, handleUpdate as EventListener)
      window.removeEventListener("storage", handleStorage)
    }
  }, [])

  return count
}

export default useWishlistCount
