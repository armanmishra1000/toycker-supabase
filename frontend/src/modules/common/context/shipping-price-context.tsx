"use client"

import { createContext, useContext, useState, ReactNode } from "react"

type ShippingPriceContextType = {
  selectedShippingPrice: number | null
  setSelectedShippingPrice: (price: number | null) => void
}

const ShippingPriceContext = createContext<ShippingPriceContextType | undefined>(undefined)

export const useShippingPrice = () => {
  const context = useContext(ShippingPriceContext)
  if (context === undefined) {
    throw new Error("useShippingPrice must be used within a ShippingPriceProvider")
  }
  return context
}

export const ShippingPriceProvider = ({ children }: { children: ReactNode }) => {
  const [selectedShippingPrice, setSelectedShippingPrice] = useState<number | null>(null)

  return (
    <ShippingPriceContext.Provider value={{ selectedShippingPrice, setSelectedShippingPrice }}>
      {children}
    </ShippingPriceContext.Provider>
  )
}
