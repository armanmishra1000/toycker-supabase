"use client"

import { addToCart, deleteLineItem } from "@lib/data/cart"
import { DEFAULT_COUNTRY_CODE } from "@lib/constants/region"
import { HttpTypes } from "@medusajs/types"
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
  product: HttpTypes.StoreProduct
  variant: HttpTypes.StoreProductVariant
  quantity: number
  countryCode?: string
  metadata?: Record<string, string | number | boolean | null>
}

type CartStoreContextValue = {
  cart: HttpTypes.StoreCart | null
  setFromServer: (cart: HttpTypes.StoreCart | null) => void
  optimisticAdd: (input: OptimisticAddInput) => Promise<void>
  optimisticRemove: (lineId: string) => Promise<void>
  reloadFromServer: () => Promise<void>
  isSyncing: boolean
  lastError: string | null
  isRemoving: (lineId: string) => boolean
}

const CartStoreContext = createContext<CartStoreContextValue | undefined>(undefined)

const mergeLineItems = (
  current: HttpTypes.StoreCart,
  nextItems: HttpTypes.StoreCartLineItem[],
): HttpTypes.StoreCart => {
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
  product: HttpTypes.StoreProduct,
  variant: HttpTypes.StoreProductVariant,
  quantity: number,
  currencyCode: string,
  cartRef: HttpTypes.StoreCart,
  metadata?: Record<string, string | number | boolean | null>,
): HttpTypes.StoreCartLineItem => {
  const tempId = `temp-${variant.id}-${Date.now()}`
  const price = variant.calculated_price?.calculated_amount ?? 0
  const original = variant.calculated_price?.original_amount ?? price
  const total = price * quantity
  const originalTotal = original * quantity

  return {
    id: tempId,
    title: variant.title ?? product.title,
    thumbnail: product.thumbnail ?? variant.product?.thumbnail ?? product.images?.[0]?.url ?? undefined,
    quantity,
    variant_id: variant.id,
    product_id: product.id,
    cart_id: "temp",
    cart: cartRef,
    metadata: metadata ?? {},
    requires_shipping: true,
    is_discountable: true,
    is_tax_inclusive: false,
    variant: {
      ...variant,
      product,
    },
    product_title: product.title,
    product_handle: product.handle ?? undefined,
    unit_price: price,
    total,
    original_total: originalTotal,
    subtotal: total,
    discount_total: 0,
    tax_total: 0,
    created_at: new Date(),
    updated_at: new Date(),
    tax_lines: [],
    adjustments: [],
    variant_sku: variant.sku ?? undefined,
    variant_barcode: variant.barcode ?? undefined,
    variant_title: variant.title ?? undefined,
  }
}

export const CartStoreProvider = ({ children }: { children: ReactNode }) => {
  const { cart: layoutCart } = useLayoutData()
  const toast = useOptionalToast()
  const showToast = toast?.showToast
  const [cart, setCart] = useState<HttpTypes.StoreCart | null>(layoutCart ?? null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const previousCartRef = useRef<HttpTypes.StoreCart | null>(layoutCart ?? null)
  const addQueueRef = useRef<Promise<void>>(Promise.resolve())
  const removeQueueRef = useRef<Promise<void>>(Promise.resolve())
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set())

  const buildEmptyCart = useCallback(
    (currencyCode: string): HttpTypes.StoreCart => ({
      id: "temp-cart",
      items: [],
      region_id: undefined,
      currency_code: currencyCode,
      subtotal: 0,
      total: 0,
      original_total: 0,
      original_subtotal: 0,
      original_tax_total: 0,
      original_item_total: 0,
      original_item_subtotal: 0,
      original_item_tax_total: 0,
      item_total: 0,
      item_subtotal: 0,
      item_tax_total: 0,
      tax_total: 0,
      discount_total: 0,
      discount_tax_total: 0,
      gift_card_total: 0,
      gift_card_tax_total: 0,
      shipping_total: 0,
      shipping_subtotal: 0,
      shipping_tax_total: 0,
      original_shipping_total: 0,
      original_shipping_subtotal: 0,
      original_shipping_tax_total: 0,
      metadata: {},
      shipping_methods: [],
      promotions: [],
      created_at: new Date(),
      updated_at: new Date(),
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

  const setFromServer = useCallback((nextCart: HttpTypes.StoreCart | null) => {
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
            const payload = (await refreshed.json()) as { cart: HttpTypes.StoreCart | null }
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
            const payload = (await response.json()) as { cart: HttpTypes.StoreCart | null }
            if (payload.cart) {
              setFromServer(payload.cart)
            }
          }
        } catch (error) {
          console.error("Failed to refresh cart after add", error)
        }
      }

      const baseCart: HttpTypes.StoreCart =
        cart ??
        buildEmptyCart(
          variant.calculated_price?.currency_code ?? layoutCart?.currency_code ?? "USD",
        )

      const areMetadataEqual = (
        left?: Record<string, string | number | boolean | null>,
        right?: Record<string, string | number | boolean | null>,
      ) => isEqual(left ?? {}, right ?? {})

      const existing = baseCart.items?.find(
        (item) => item.variant_id === variant.id && areMetadataEqual(item.metadata as any, metadata),
      )
      let nextItems: HttpTypes.StoreCartLineItem[]

      if (existing) {
        const updatedItem: HttpTypes.StoreCartLineItem = {
          ...existing,
          quantity: existing.quantity + quantity,
          total: (existing.total ?? 0) + (existing.unit_price ?? 0) * quantity,
          original_total:
            (existing.original_total ?? existing.total ?? 0) + (existing.unit_price ?? 0) * quantity,
          updated_at: new Date(),
        }
        nextItems = baseCart.items!.map((item) => (item.id === existing.id ? updatedItem : item))
      } else {
        const optimistic = buildOptimisticLineItem(
          product,
          variant,
          quantity,
          baseCart.currency_code,
          baseCart,
          metadata,
        )
        nextItems = [...(baseCart.items ?? []), optimistic]
      }

      const optimisticCart = mergeLineItems(baseCart, nextItems)
      setCart(optimisticCart)

      const runServerAdd = async () => {
        try {
          const idempotencyKey =
            typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
              ? crypto.randomUUID()
              : `cart-${Date.now()}-${Math.random()}`

          const serverCart = await addToCart({
            variantId: variant.id,
            quantity,
            countryCode: targetCountry,
            metadata,
            idempotencyKey,
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
      const payload = (await response.json()) as { cart: HttpTypes.StoreCart | null }
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
