"use client"

import React, { createContext, useContext, useState, useTransition } from "react"

type CatalogLoadingContextType = {
    isFetching: boolean
    setIsFetching: (value: boolean) => void
    isPending: boolean
    startTransition: React.TransitionStartFunction
}

const CatalogLoadingContext = createContext<CatalogLoadingContextType | null>(null)

export const CatalogLoadingProvider = ({ children }: { children: React.ReactNode }) => {
    const [isFetching, setIsFetching] = useState(false)
    const [isPending, startTransition] = useTransition()

    return (
        <CatalogLoadingContext.Provider value={{ isFetching, setIsFetching, isPending, startTransition }}>
            {children}
        </CatalogLoadingContext.Provider>
    )
}

export const useCatalogLoading = () => {
    const context = useContext(CatalogLoadingContext)
    return context
}
