"use client"

import { addToCart, deleteLineItem } from "@lib/data/cart"
import { DEFAULT_COUNTRY_CODE } from "@lib/constants/region"
import { Cart, Product, ProductVariant, CartItem } from "@/lib/supabase/types"
import isEqual from "lodash/isEqual"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useLayoutData } from "@modules/layout/context/layout-data-context"
import { useOptionalToast } from "@modules/common/context/toast-context"

type OptimisticAddInput = {
  product: Product
  variant: ProductVariant
  quantity: number
  countryCode?: string
  metadata?: Record<string, string | number | boolean | null>
}

type CartStoreContextValue = {
  cart: Cart | null
  setFromServer: (cart: Cart | null) => void
  optimisticAdd: (input: OptimisticAddInput) => Promise<void>
  optimisticRemove: (lineId: string) => Promise<void>
  reloadFromServer: () => Promise<void>
  isSyncing: boolean
  lastError: string | null
  isRemoving: (lineId: string) => boolean
}

const CartStoreContext = createContext<CartStoreContextValue | undefined>(undefined)

const mergeLineItems = (
  current: Cart,
  nextItems: CartItem[],
): Cart => {
  const itemSubtotal = nextItems.reduce((sum, item) => sum + (item.total ?? 0), 0)
  return {
    ...current,
    items: nextItems,
    item_subtotal: itemSubtotal,
    subtotal: itemSubtotal,
    total: itemSubtotal + (current.shipping_subtotal ?? 0) + (current.tax_total ?? 0),
  }
}

const buildOptimisticLineItem = (
  product: Product,
  variant: ProductVariant,
  quantity: number,
  currencyCode: string,
  cartRef: Cart,
  metadata?: Record<string, string | number | boolean | null>,
): CartItem => {
  const tempId = `temp-${variant.id}-${Date.now()}`
  const price = variant.calculated_price?.calculated_amount ?? variant.price
  const original = variant.calculated_price?.original_amount ?? price
  const total = price * quantity
  const originalTotal = original * quantity

  return {
    id: tempId,
    title: variant.title ?? product.title,
    thumbnail: product.thumbnail ?? product.image_url ?? undefined,
    quantity,
    variant_id: variant.id,
    product_id: product.id,
    cart_id: "temp",
    metadata: metadata ?? {},
    variant: variant,
    product: product,
    product_title: product.title,
    product_handle: product.handle ?? undefined,
    unit_price: price,
    total,
    original_total: originalTotal,
    subtotal: total,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

export const CartStoreProvider = ({ children }: { children: ReactNode }) => {
  const { cart: layoutCart } = useLayoutData()
  const toast = useOptionalToast()
  const showToast = toast?.showToast
  const [cart, setCart] = useState<Cart | null>(layoutCart ?? null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const previousCartRef = useRef<Cart | null>(layoutCart ?? null)
  const addQueueRef = useRef<Promise<void>>(Promise.resolve())
  const removeQueueRef = useRef<Promise<void>>(Promise.resolve())
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set())

  const buildEmptyCart = useCallback(
    (currencyCode: string): Cart => ({
      id: "temp-cart",
      items: [],
      user_id: null,
      currency_code: currencyCode,
      subtotal: 0,
      total: 0,
      original_total: 0,
      item_total: 0,
      item_subtotal: 0,
      tax_total: 0,
      discount_total: 0,
      gift_card_total: 0,
      shipping_total: 0,
      shipping_subtotal: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
    [],
  )


  // Sync in-memory cart when layout cart updates
  useEffect(() => {
    if (!layoutCart) return
    const hasChanged = layoutCart.updated_at !== previousCartRef.current?.updated_at
    if (hasChanged) {
      previousCartRef.current = layoutCart
      setCart(layoutCart)
    }
  }, [layoutCart])

  const setFromServer = useCallback((nextCart: Cart | null) => {
    setCart(nextCart)
    previousCartRef.current = nextCart
  }, [])

  const isRemoving = useCallback(
    (lineId: string) => removingIds.has(lineId),
    [removingIds],
  )

  const optimisticRemove = useCallback(
    async (lineId: string) => {
      if (!cart) {
        setLastError("No cart found to remove item from")
        return
      }

      setLastError(null)

      setRemovingIds((prev) => {
        const next = new Set(prev)
        next.add(lineId)
        return next
      })

      const runServerRemove = async () => {
        try {
          await deleteLineItem(lineId)
          const refreshed = await fetch(`/api/cart?ts=${Date.now()}`, { cache: "no-store" })
          if (refreshed.ok) {
            const payload = (await refreshed.json()) as { cart: Cart | null }
            setFromServer(payload.cart)
            showToast?.("Item removed from cart", "success")
          }
        } catch (error) {
          const errorMessage = (error as Error)?.message ?? "Failed to remove item"
          setLastError(errorMessage)
          showToast?.(errorMessage, "error")
          throw error
        } finally {
          setRemovingIds((prev) => {
            const next = new Set(prev)
            next.delete(lineId)
            return next
          })
        }
      }

      removeQueueRef.current = removeQueueRef.current
        .catch(() => undefined)
        .then(() => runServerRemove())
      await removeQueueRef.current
    },
    [cart, setFromServer, toast],
  )

  const optimisticAdd = useCallback(
    async ({ product, variant, quantity, countryCode, metadata }: OptimisticAddInput) => {
      const targetCountry = countryCode ?? DEFAULT_COUNTRY_CODE
      setLastError(null)

      const previousCart = cart

      const refreshFromApi = async () => {
        try {
        const response = await fetch(`/api/cart?ts=${Date.now()}`, { cache: "no-store" })
          if (response.ok) {
            const payload = (await response.json()) as { cart: Cart | null }
            if (payload.cart) {
              setFromServer(payload.cart)
            }
          }
        } catch (error) {
          console.error("Failed to refresh cart after add", error)
        }
      }

      const baseCart: Cart =
        cart ??
        buildEmptyCart(
          variant.calculated_price?.currency_code ?? layoutCart?.currency_code ?? "USD",
        )

      const areMetadataEqual = (
        left?: Record<string, unknown>,
        right?: Record<string, unknown>,
      ) => isEqual(left ?? {}, right ?? {})

      const existing = baseCart.items?.find(
        (item) => item.variant_id === variant.id && areMetadataEqual(item.metadata as any, metadata),
      )
      let nextItems: CartItem[]

      if (existing) {
        const updatedItem: CartItem = {
          ...existing,
          quantity: existing.quantity + quantity,
          total: (existing.total ?? 0) + (existing.unit_price ?? 0) * quantity,
          original_total:
            (existing.original_total ?? existing.total ?? 0) + (existing.unit_price ?? 0) * quantity,
          updated_at: new Date().toISOString(),
        }
        nextItems = baseCart.items!.map((item) => (item.id === existing.id ? updatedItem : item))
      } else {
        const optimistic = buildOptimisticLineItem(
          product,
          variant,
          quantity,
          baseCart.currency_code,
          baseCart,
          metadata as any,
        )
        nextItems = [...(baseCart.items ?? []), optimistic]
      }

      const optimisticCart = mergeLineItems(baseCart, nextItems)
      setCart(optimisticCart)

      const runServerAdd = async () => {
        try {
          const serverCart = await addToCart({
            productId: product.id, // Changed to match Supabase addToCart signature
            quantity,
          })

          if (serverCart) {
            setFromServer(serverCart)
            await refreshFromApi()
            showToast?.("Item added to cart", "success")
            return
          }
        } catch (error) {
          const errorMessage = (error as Error)?.message ?? "Failed to add to cart"
          setLastError(errorMessage)
          showToast?.(errorMessage, "error")
          setCart(previousCart)
          throw error
        }
      }

      addQueueRef.current = addQueueRef.current.then(() => runServerAdd())
      await addQueueRef.current
    },
    [buildEmptyCart, cart, layoutCart?.currency_code, setFromServer, toast],
  )

  const reloadFromServer = useCallback(async () => {
    setIsSyncing(true)
    setLastError(null)
    try {
      const response = await fetch(`/api/cart?ts=${Date.now()}`, { cache: "no-store" })
      if (!response.ok) {
        throw new Error("Failed to reload cart")
      }
      const payload = (await response.json()) as { cart: Cart | null }
      setFromServer(payload.cart)
      showToast?.("Cart reloaded", "success")
    } catch (error) {
      const errorMessage = (error as Error)?.message ?? "Failed to reload cart"
      setLastError(errorMessage)
      showToast?.(errorMessage, "error")
    } finally {
      setIsSyncing(false)
    }
  }, [setFromServer, toast])

  const value = useMemo(
    () => ({
      cart,
      setFromServer,
      optimisticAdd,
      optimisticRemove,
      reloadFromServer,
      isSyncing,
      lastError,
      isRemoving,
    }),
    [cart, isSyncing, lastError, optimisticAdd, optimisticRemove, reloadFromServer, setFromServer, isRemoving],
  )

  return <CartStoreContext.Provider value={value}>{children}</CartStoreContext.Provider>
}

export const useCartStore = () => {
  const context = useContext(CartStoreContext)
  if (!context) {
    throw new Error("useCartStore must be used within a CartStoreProvider")
  }
  return context
}

export const useOptionalCartStore = () => useContext(CartStoreContext)