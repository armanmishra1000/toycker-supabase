"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"

interface CheckoutContextType {
    isUpdating: boolean
    setSectionUpdating: (section: string, updating: boolean) => void
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined)

export const CheckoutProvider = ({ children }: { children: ReactNode }) => {
    const [updatingSections, setUpdatingSections] = useState<Record<string, boolean>>({})

    const setSectionUpdating = React.useCallback((section: string, updating: boolean) => {
        setUpdatingSections(prev => {
            if (prev[section] === updating) return prev
            return { ...prev, [section]: updating }
        })
    }, [])

    const isUpdating = React.useMemo(() => Object.values(updatingSections).some(v => v), [updatingSections])

    const value = React.useMemo(() => ({
        isUpdating,
        setSectionUpdating
    }), [isUpdating, setSectionUpdating])

    return (
        <CheckoutContext.Provider value={value}>
            {children}
        </CheckoutContext.Provider>
    )
}

export const useCheckout = () => {
    const context = useContext(CheckoutContext)
    if (context === undefined) {
        throw new Error("useCheckout must be used within a CheckoutProvider")
    }
    return context
}
