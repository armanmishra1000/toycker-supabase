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

type LayoutDataContextValue = {
  cart: any
  setCart: (cart: any) => void
  customer: any
  setCustomer: (customer: any) => void
  shippingOptions: any[]
  loading: boolean
  refresh: () => Promise<void>
  loadShippingOptions: () => Promise<void>
}

const LayoutDataContext = createContext<LayoutDataContextValue | undefined>(undefined)

const fetchLayoutState = async (signal?: AbortSignal) => {
  const response = await fetch("/api/storefront/layout-state", {
    cache: "no-store",
    signal,
  })

  if (!response.ok) {
    throw new Error("Failed to load layout state")
  }

  return (await response.json()) as {
    cart: any
    customer: any
  }
}

const fetchShippingOptions = async (signal?: AbortSignal) => {
  try {
    const response = await fetch("/api/storefront/shipping-options", {
      cache: "no-store",
      signal,
    })

    if (!response.ok) {
      throw new Error("Failed to load shipping options")
    }

    return (await response.json()) as {
      shippingOptions: any[]
      regionId: string | null
    }
  } catch (error) {
    if ((error as Error)?.name === "AbortError") {
      return {
        shippingOptions: [],
        regionId: null,
      }
    }
    throw error
  }
}

export const LayoutDataProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<any>(null)
  const [customer, setCustomer] = useState<any>(null)
  const [shippingOptions, setShippingOptions] = useState<any[]>([])
  const [shippingOptionsRegion, setShippingOptionsRegion] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const abortController = useRef<AbortController | null>(null)
  const shippingAbortController = useRef<AbortController | null>(null)

  const loadShippingOptions = useCallback(async () => {
    if (!cart?.id) {
      setShippingOptions([])
      setShippingOptionsRegion(null)
      return
    }

    if (shippingOptions.length && shippingOptionsRegion === cart.region_id) {
      return
    }

    shippingAbortController.current?.abort()

    const controller = new AbortController()
    shippingAbortController.current = controller

    try {
      const payload = await fetchShippingOptions(controller.signal)
      setShippingOptions(payload.shippingOptions)
      setShippingOptionsRegion(payload.regionId ?? cart.region_id ?? null)
    } catch (error) {
      if ((error as Error)?.name === "AbortError") {
        return
      }
      console.error("Failed to load shipping options", error)
    } finally {
      if (shippingAbortController.current === controller) {
        shippingAbortController.current = null
      }
    }
  }, [cart?.id, cart?.region_id, shippingOptions.length, shippingOptionsRegion])

  const refresh = useCallback(async () => {
    abortController.current?.abort()

    const controller = new AbortController()
    abortController.current = controller
    setLoading(true)

    try {
      const payload = await fetchLayoutState(controller.signal)
      setCart(payload.cart)
      setCustomer(payload.customer)

      if (!payload.cart) {
        setShippingOptions([])
        setShippingOptionsRegion(null)
      } else if (
        shippingOptionsRegion &&
        payload.cart.region_id &&
        payload.cart.region_id !== shippingOptionsRegion
      ) {
        setShippingOptions([])
        setShippingOptionsRegion(null)
      }
    } catch (error) {
      if ((error as Error)?.name === "AbortError") {
        return
      }
      console.error("Failed to refresh layout data", error)
    } finally {
      if (abortController.current === controller) {
        setLoading(false)
        abortController.current = null
      }
    }
  }, [shippingOptionsRegion])

  useEffect(() => {
    refresh()

    return () => {
      abortController.current?.abort()
      shippingAbortController.current?.abort()
    }
  }, [refresh])

  const value = useMemo(
    () => ({
      cart,
      setCart,
      customer,
      setCustomer,
      shippingOptions,
      loading,
      refresh,
      loadShippingOptions,
    }),
    [cart, customer, shippingOptions, loading, refresh, loadShippingOptions],
  )

  return <LayoutDataContext.Provider value={value}>{children}</LayoutDataContext.Provider>
}

export const useLayoutData = () => {
  const context = useContext(LayoutDataContext)

  if (!context) {
    throw new Error("useLayoutData must be used within a LayoutDataProvider")
  }

  return context
}
