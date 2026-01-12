"use client"

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

import {
  addToWishlist,
  getWishlistItems,
  removeFromWishlist,
} from "@lib/data/wishlist"

type WishlistContextValue = {
  items: string[]
  isInWishlist: (_productId: string) => boolean
  toggleWishlist: (_productId: string) => Promise<void>
  isInitialized: boolean
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
  loginPath?: string
}

export const WishlistProvider = ({
  children,
  loginPath = "/account",
}: WishlistProviderProps) => {
  const [items, setItems] = useState<string[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const isInitializing = useRef(false)
  const router = useRouter()

  // Fetch auth status and wishlist on mount (client-side)
  useEffect(() => {
    if (isInitializing.current) return
    isInitializing.current = true

    const initializeWishlist = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const authenticated = !!user
      setIsAuthenticated(authenticated)

      if (authenticated) {
        const dbItems = await getWishlistItems()
        setItems(dbItems)
      } else {
        setItems(readFromStorage())
      }
      setIsInitialized(true)
    }

    initializeWishlist()
  }, [])

  // Handle guest items merging when user logs in
  useEffect(() => {
    if (!isAuthenticated || !isInitialized) {
      return
    }

    const guestItems = readFromStorage()
    if (guestItems.length === 0) {
      // Even if no items, we clear the storage to avoid carrying over "guest" state
      window.localStorage.removeItem(STORAGE_KEY)
      return
    }

    const merge = async () => {
      // Filter out items already in the DB to avoid redundant requests
      const newItems = guestItems.filter((id) => !items.includes(id))

      if (newItems.length > 0) {
        // Sequentially add items (safe for simple wishlists)
        for (const productId of newItems) {
          try {
            await addToWishlist(productId)
          } catch (error) {
            console.error(`Failed to merge item ${productId}:`, error)
          }
        }
        // Force a re-fetch of the items from the DB to ensure sync
        const dbItems = await getWishlistItems()
        setItems(dbItems)
      }

      window.localStorage.removeItem(STORAGE_KEY)
    }

    merge()
  }, [isAuthenticated, isInitialized, items]) // Depend on initialized to ensure we have the current DB state

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
    async (productId: string) => {
      if (!isAuthenticated) {
        redirectToLogin()
        return
      }

      const isRemoving = items.includes(productId)

      try {
        if (isRemoving) {
          await removeFromWishlist(productId)
          setItems((prev) => prev.filter((id) => id !== productId))
        } else {
          await addToWishlist(productId)
          setItems((prev) => [...prev, productId])
        }
      } catch (error) {
        console.error("Wishlist operation failed:", error)
        throw error // Re-throw so the button can handle loading state
      }
    },
    [isAuthenticated, items, redirectToLogin]
  )

  const value = useMemo<WishlistContextValue>(
    () => ({
      items,
      isInWishlist: (productId: string) => items.includes(productId),
      toggleWishlist,
      isInitialized,
    }),
    [items, toggleWishlist, isInitialized]
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
