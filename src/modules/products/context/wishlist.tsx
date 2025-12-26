"use client"

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useRouter } from "next/navigation"

type WishlistContextValue = {
  items: string[]
  isInWishlist: (productId: string) => boolean
  toggleWishlist: (productId: string) => void
}

export const WISHLIST_UPDATED_EVENT = "toycker:wishlist:update"

const WishlistContext = createContext<WishlistContextValue | null>(null)

const STORAGE_KEY = "toycker_wishlist"

const readFromStorage = (): string[] => {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

type WishlistProviderProps = {
  children: ReactNode
  isAuthenticated?: boolean
  loginPath?: string
}

export const WishlistProvider = ({
  children,
  isAuthenticated = false,
  loginPath = "/account",
}: WishlistProviderProps) => {
  const [items, setItems] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    setItems(readFromStorage())
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Ignore storage errors for prototype scope
    }
  }, [items])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const event = new CustomEvent(WISHLIST_UPDATED_EVENT, {
      detail: { items, count: items.length },
    })

    window.dispatchEvent(event)
  }, [items])

  const buildLoginRedirect = useCallback(() => {
    if (typeof window === "undefined") {
      return loginPath
    }

    const redirectTarget = `${window.location.pathname}${window.location.search}`
    const separator = loginPath.includes("?") ? "&" : "?"
    const encoded = encodeURIComponent(redirectTarget)
    return `${loginPath}${separator}redirect=${encoded}`
  }, [loginPath])

  const redirectToLogin = useCallback(() => {
    if (typeof window === "undefined") {
      return
    }

    const target = buildLoginRedirect()

    try {
      router.push(target)
    } catch {
      window.location.assign(target)
    }
  }, [buildLoginRedirect, router])

  const toggleWishlist = useCallback(
    (productId: string) => {
      if (!isAuthenticated) {
        redirectToLogin()
        return
      }

      setItems((prev) => {
        if (prev.includes(productId)) {
          return prev.filter((id) => id !== productId)
        }
        return [...prev, productId]
      })
    },
    [isAuthenticated, redirectToLogin]
  )

  const value = useMemo<WishlistContextValue>(
    () => ({
      items,
      isInWishlist: (productId: string) => items.includes(productId),
      toggleWishlist,
    }),
    [items, toggleWishlist]
  )

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export const useWishlist = () => {
  const context = useContext(WishlistContext)

  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider")
  }

  return context
}

export const useOptionalWishlist = () => useContext(WishlistContext)
