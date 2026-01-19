"use client"

import { useState, useMemo, useEffect } from "react"
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline"

interface Product {
    id: string
    name: string
    thumbnail: string | null
}

interface ProductCheckboxListProps {
    products: Product[]
    selectedProductIds: string[]
}

export function ProductCheckboxList({ products, selectedProductIds }: ProductCheckboxListProps) {
    const [searchQuery, setSearchQuery] = useState("")
    // Maintain local state for checkboxes to ensure UI is responsive and "Select All" works instantly
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(selectedProductIds))

    // Sync with prop if it changes (e.g. on reset or initial load)
    useEffect(() => {
        setSelectedIds(new Set(selectedProductIds))
    }, [selectedProductIds])

    // Filter products based on search query
    const filteredProducts = useMemo(() =>
        products.filter((product) =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase())
        ), [products, searchQuery]
    )

    const handleSelectAll = () => {
        const newSelected = new Set(selectedIds)
        filteredProducts.forEach(p => newSelected.add(p.id))
        setSelectedIds(newSelected)
    }

    const handleDeselectAll = () => {
        const newSelected = new Set(selectedIds)
        filteredProducts.forEach(p => newSelected.delete(p.id))
        setSelectedIds(newSelected)
    }

    const handleToggle = (productId: string) => {
        const newSelected = new Set(selectedIds)
        if (newSelected.has(productId)) {
            newSelected.delete(productId)
        } else {
            newSelected.add(productId)
        }
        setSelectedIds(newSelected)
    }

    if (products.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 text-sm">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="font-medium text-gray-900">No products available</p>
            </div>
        )
    }

    const allFilteredSelected = filteredProducts.length > 0 && filteredProducts.every(p => selectedIds.has(p.id))

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Search and controls - Fixed/Sticky Header */}
            <div className="sticky top-0 z-20 bg-white pt-4 px-4 pb-3 border-b space-y-3">
                {/* Search input */}
                <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search products by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 pl-10 pr-10 py-2.5 text-sm focus:border-black focus:ring-1 focus:ring-black"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    )}
                </div>

                {/* Stats and controls */}
                <div className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="text-gray-600">
                        {searchQuery ? (
                            <span>
                                Found <span className="font-medium text-gray-900">{filteredProducts.length}</span>
                            </span>
                        ) : (
                            <span>
                                <span className="font-medium text-gray-900">{selectedIds.size}</span> selected
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={allFilteredSelected ? handleDeselectAll : handleSelectAll}
                            className="text-xs sm:text-sm font-medium text-black hover:underline transition-colors"
                        >
                            {allFilteredSelected ? "Clear Selection" : "Select All"}
                            {searchQuery && " (Filtered)"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Product list - Scrollable content */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <svg className="mx-auto h-10 w-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className="text-sm font-medium text-gray-900">No matching products</p>
                    </div>
                ) : (
                    filteredProducts.map((product) => {
                        const isSelected = selectedIds.has(product.id)

                        return (
                            <label
                                key={product.id}
                                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all border ${isSelected
                                        ? "bg-gray-50 border-gray-300 shadow-sm"
                                        : "border-transparent hover:bg-gray-50 hover:border-gray-200"
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    name="product_ids"
                                    value={product.id}
                                    checked={isSelected}
                                    onChange={() => handleToggle(product.id)}
                                    className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black focus:ring-offset-0 cursor-pointer"
                                />

                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {product.thumbnail ? (
                                        <img
                                            src={product.thumbnail}
                                            alt={product.name}
                                            className="w-10 h-10 rounded object-cover flex-shrink-0 bg-gray-100 border border-gray-100"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded bg-gray-100 flex-shrink-0 flex items-center justify-center border border-gray-100">
                                            <svg
                                                className="w-5 h-5 text-gray-400"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                />
                                            </svg>
                                        </div>
                                    )}

                                    <span className="text-sm font-medium text-gray-900 truncate">
                                        {product.name}
                                    </span>
                                </div>
                            </label>
                        )
                    })
                )}
            </div>
        </div>
    )
}
