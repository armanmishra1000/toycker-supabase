"use client"

import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from "react"

type ShippingPriceContextType = {
  selectedShippingPrice: number | null
  setSelectedShippingPrice: (_price: number | null) => void
}

export const ShippingPriceContext = createContext<ShippingPriceContextType | undefined>(undefined)

export const useShippingPrice = () => {
  const context = useContext(ShippingPriceContext)
  if (context === undefined) {
    throw new Error("useShippingPrice must be used within a ShippingPriceProvider")
  }
  return context
}

export const ShippingPriceProvider = ({ children }: { children: ReactNode }) => {
  const [selectedShippingPrice, setSelectedShippingPrice] = useState<number | null>(null)

  const setPrice = useCallback((price: number | null) => {
    setSelectedShippingPrice(price)
  }, [])

  const value = useMemo(
    () => ({ selectedShippingPrice, setSelectedShippingPrice: setPrice }),
    [selectedShippingPrice, setPrice]
  )

  return (
    <ShippingPriceContext.Provider value={value}>
      {children}
    </ShippingPriceContext.Provider>
  )
}
