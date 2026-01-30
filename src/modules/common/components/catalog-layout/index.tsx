"use client"

import React, { useEffect } from "react"
import { useCatalogLoading, CatalogLoadingProvider } from "@modules/common/context/catalog-loading-context"
import CatalogGridSkeleton from "@modules/common/components/skeletons/catalog-grid-skeleton"

type CatalogLayoutProps = {
    children: React.ReactNode
    page: number
}

const CatalogContent = ({ children, page }: { children: React.ReactNode; page: number }) => {
    const catalogLoading = useCatalogLoading()

    // Reset loading state when the page or content changes
    useEffect(() => {
        if (catalogLoading) {
            catalogLoading.setIsFetching(false)
        }
    }, [page, catalogLoading])

    const isLoading = catalogLoading?.isFetching || catalogLoading?.isPending

    if (isLoading) {
        return (
            <div className="animate-in fade-in duration-300">
                <CatalogGridSkeleton />
            </div>
        )
    }

    return (
        <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
            {children}
        </div>
    )
}

export const CatalogLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <CatalogLoadingProvider>
            {children}
        </CatalogLoadingProvider>
    )
}

export const CatalogGridWrapper = ({ children, page }: { children: React.ReactNode; page: number }) => {
    return <CatalogContent page={page}>{children}</CatalogContent>
}
