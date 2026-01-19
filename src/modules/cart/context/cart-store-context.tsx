"use client"

import { addToCart, deleteLineItem, updateLineItem } from "@lib/data/cart"
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
import { useCartPersistence } from "@lib/hooks/use-cart-persistence"

type OptimisticAddInput = {
  product: Product
  variant?: ProductVariant // Make optional
  quantity: number
  countryCode?: string
  metadata?: Record<string, string | number | boolean | null>
}

type CartStoreContextValue = {
  cart: Cart | null
  setFromServer: (_cart: Cart | null) => void
  clearCart: () => void
  optimisticAdd: (_input: OptimisticAddInput) => Promise<void>
  optimisticRemove: (_lineId: string) => Promise<void>
  optimisticUpdateQuantity: (_lineId: string, _quantity: number) => Promise<void>
  reloadFromServer: () => Promise<void>
  applyPromotionCode: (_code: string) => Promise<void>
  removePromotionCode: (_code: string) => Promise<void>
  applyRewards: (_points: number) => Promise<void>
  isSyncing: boolean
  lastError: string | null
  isRemoving: (_lineId: string) => boolean
  isUpdating: (_lineId: string) => boolean
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
  variant: ProductVariant | undefined,
  quantity: number,
  _cartRef: Cart,
  metadata?: Record<string, string | number | boolean | null>,
): CartItem => {
  const meta = (metadata as Record<string, unknown>) ?? {}
  const tempId = `temp-${variant?.id || product.id}-${meta.gift_wrap_line ? 'gift' : 'prod'}-${Date.now()}`
  const basePrice = variant?.price || product.price

  // Calculate price: If it's a separate gift wrap line, use fee. Otherwise use product price.
  const isGiftWrapLine = meta.gift_wrap_line === true
  const giftWrapFee = Number(meta.gift_wrap_fee || 0)

  const unitPrice = isGiftWrapLine ? giftWrapFee : basePrice
  const total = unitPrice * quantity

  return {
    id: tempId,
    title: isGiftWrapLine ? "Gift Wrap" : (variant?.title || product.name),
    thumbnail: isGiftWrapLine ? "/assets/images/gift-wrap.png" : (product.thumbnail || product.image_url || undefined),
    quantity,
    variant_id: isGiftWrapLine ? null : (variant?.id || null),
    product_id: product.id,
    cart_id: "temp",
    metadata: meta,
    variant: isGiftWrapLine ? undefined : (variant || undefined),
    product: product,
    product_title: isGiftWrapLine ? "Gift Wrap" : product.name,
    product_handle: isGiftWrapLine ? undefined : (product.handle ?? undefined),
    unit_price: unitPrice,
    total,
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
  const updateQueueRef = useRef<Promise<void>>(Promise.resolve())
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set())
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())

  const buildEmptyCart = useCallback(
    (currencyCode: string): Cart => ({
      id: "temp-cart",
      items: [],
      user_id: null,
      currency_code: currencyCode,
      subtotal: 0,
      total: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
    [],
  )

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

  const clearCart = useCallback(() => {
    setCart(null)
    previousCartRef.current = null
    setRemovingIds(new Set())
    setUpdatingIds(new Set())
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
        setIsSyncing(true)
        try {
          const serverCart = await deleteLineItem(lineId)
          if (serverCart) {
            setFromServer(serverCart)
          }
        } catch (error) {
          const errorMessage = (error as Error)?.message ?? "Failed to remove item"
          setLastError(errorMessage)
          showToast?.(errorMessage, "error")
          throw error
        } finally {
          setIsSyncing(false)
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
    },
    [cart, setFromServer, showToast],
  )

  const optimisticAdd = useCallback(
    async ({ product, variant, quantity, countryCode, metadata }: OptimisticAddInput) => {
      const _targetCountry = countryCode ?? DEFAULT_COUNTRY_CODE
      setLastError(null)

      const previousCart = cart


      const baseCart: Cart =
        cart ??
        buildEmptyCart(
          layoutCart?.currency_code ?? "inr",
        )

      const areMetadataEqual = (
        left?: Record<string, unknown>,
        right?: Record<string, unknown>,
      ) => isEqual(left ?? {}, right ?? {})

      const existing = baseCart.items?.find(
        (item) => item.variant_id === (variant?.id || null) && areMetadataEqual(item.metadata, metadata as Record<string, unknown>),
      )
      let nextItems: CartItem[]

      if (existing) {
        const updatedItem: CartItem = {
          ...existing,
          quantity: existing.quantity + quantity,
          total: (existing.total ?? 0) + (existing.unit_price ?? 0) * quantity,
          updated_at: new Date().toISOString(),
        }
        nextItems = baseCart.items!.map((item) => (item.id === existing.id ? updatedItem : item))
      } else {
        const optimistic = buildOptimisticLineItem(
          product,
          variant,
          quantity,
          baseCart,
          metadata,
        )
        nextItems = [...(baseCart.items ?? []), optimistic]
      }

      const optimisticCart = mergeLineItems(baseCart, nextItems)
      setCart(optimisticCart)

      const runServerAdd = async () => {
        setIsSyncing(true)
        try {
          const serverCart = await addToCart({
            productId: product.id,
            quantity,
            variantId: variant?.id,
            metadata: metadata as Record<string, unknown>,
          })

          if (serverCart) {
            setFromServer(serverCart)
            // Toast removed - silent add for better UX
            return
          }
        } catch (error) {
          const errorMessage = (error as Error)?.message ?? "Failed to add to cart"
          setLastError(errorMessage)
          showToast?.(errorMessage, "error")
          setCart(previousCart)
          throw error
        } finally {
          setIsSyncing(false)
        }
      }

      addQueueRef.current = addQueueRef.current.then(() => runServerAdd())
      // Removed await to make transition instantaneous
    },
    [buildEmptyCart, cart, layoutCart?.currency_code, setFromServer, showToast],
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
      // Toast removed - silent reload for better UX
    } catch (error) {
      const errorMessage = (error as Error)?.message ?? "Failed to reload cart"
      setLastError(errorMessage)
      showToast?.(errorMessage, "error")
    } finally {
      setIsSyncing(false)
    }
  }, [setFromServer, showToast])

  const applyPromotionCode = useCallback(async (code: string) => {
    setIsSyncing(true)
    try {
      const { applyPromotions } = await import("@lib/data/cart")
      await applyPromotions([code])
      await reloadFromServer()
    } catch (error) {
      const errorMessage = (error as Error)?.message ?? "Failed to apply promotion"
      setLastError(errorMessage)
      throw error
    } finally {
      setIsSyncing(false)
    }
  }, [reloadFromServer, showToast])

  const removePromotionCode = useCallback(async (_code: string) => {
    setIsSyncing(true)
    try {
      const { applyPromotions } = await import("@lib/data/cart")
      // Logic to remove only this code if multiple were allowed, but it's single-code for now
      await applyPromotions([])
      await reloadFromServer()
    } catch (error) {
      const errorMessage = (error as Error)?.message ?? "Failed to remove promotion"
      setLastError(errorMessage)
      showToast?.(errorMessage, "error")
    } finally {
      setIsSyncing(false)
    }
  }, [reloadFromServer, showToast])

  const applyRewards = useCallback(async (points: number) => {
    setIsSyncing(true)
    try {
      const { updateCartRewards } = await import("@lib/data/cart")
      await updateCartRewards(points)
      await reloadFromServer()
    } catch (error) {
      const errorMessage = (error as Error)?.message ?? "Failed to apply rewards"
      setLastError(errorMessage)
      throw error
    } finally {
      setIsSyncing(false)
    }
  }, [reloadFromServer, showToast])

  // Enable localStorage persistence and cross-tab sync
  useCartPersistence(cart, reloadFromServer)




  const isUpdating = useCallback(
    (lineId: string) => updatingIds.has(lineId),
    [updatingIds]
  )

  const optimisticUpdateQuantity = useCallback(
    async (lineId: string, quantity: number) => {
      if (!cart) {
        setLastError("No cart found")
        return
      }

      setLastError(null)
      setUpdatingIds((prev) => {
        const next = new Set(prev)
        next.add(lineId)
        return next
      })

      const previousCart = cart

      const nextItems = cart.items?.map((item) => {
        if (item.id === lineId) {
          const baseUnitPrice = item.unit_price ?? 0

          // Note: unit_price should already include gift wrap fee if it was fetched correctly,
          // but we ensure it matches the metadata for consistent optimistic UI.
          const total = baseUnitPrice * quantity

          return {
            ...item,
            quantity,
            total: total,
            original_total: (item.original_unit_price ?? baseUnitPrice) * quantity,
            updated_at: new Date().toISOString(),
          }
        }
        return item
      })

      if (nextItems) {
        setCart(mergeLineItems(cart, nextItems))
      }

      const runServerUpdate = async () => {
        setIsSyncing(true)
        try {
          const serverCart = await updateLineItem({ lineId, quantity })
          if (serverCart) {
            setFromServer(serverCart)
          }
        } catch (error) {
          const errorMessage = (error as Error)?.message ?? "Failed to update quantity"
          setLastError(errorMessage)
          showToast?.(errorMessage, "error")
          setCart(previousCart)
        } finally {
          setIsSyncing(false)
          setUpdatingIds((prev) => {
            const next = new Set(prev)
            next.delete(lineId)
            return next
          })
        }
      }

      updateQueueRef.current = updateQueueRef.current
        .catch(() => undefined)
        .then(() => runServerUpdate())
    },
    [cart, setFromServer, showToast]
  )

  const value = useMemo(
    () => ({
      cart,
      setFromServer,
      clearCart,
      optimisticAdd,
      optimisticRemove,
      optimisticUpdateQuantity,
      reloadFromServer,
      applyPromotionCode,
      removePromotionCode,
      applyRewards,
      isSyncing,
      lastError,
      isRemoving,
      isUpdating,
    }),
    [
      cart,
      isSyncing,
      lastError,
      optimisticAdd,
      optimisticRemove,
      optimisticUpdateQuantity,
      reloadFromServer,
      applyPromotionCode,
      removePromotionCode,
      setFromServer,
      clearCart,
      isRemoving,
      isUpdating,
      applyRewards
    ]
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