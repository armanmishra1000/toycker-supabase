"use client"

import { useState, useEffect } from "react"
import { ChevronDownIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline"

type Product = {
    id: string
    title: string
    handle: string
    thumbnail: string | null
}

type Props = {
    value: string
    onChange: (_productId: string) => void
    disabled?: boolean
}

export default function ProductSelector({ value, onChange, disabled = false }: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const [products, setProducts] = useState<Product[]>([])
    const [search, setSearch] = useState("")
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const loadProducts = async () => {
            setLoading(true)
            try {
                const response = await fetch("/api/products")
                if (response.ok) {
                    const data = await response.json()
                    setProducts(data.products || [])
                }
            } catch (error) {
                console.error("Error loading products:", error)
            } finally {
                setLoading(false)
            }
        }

        if (isOpen && products.length === 0) {
            loadProducts()
        }
    }, [isOpen, products.length])

    const selectedProduct = products.find((p) => p.id === value)

    const filteredProducts = products.filter((product) =>
        product.title.toLowerCase().includes(search.toLowerCase()) ||
        product.handle.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white hover:bg-gray-50"
                    }`}
            >
                <span className={selectedProduct ? "text-gray-900" : "text-gray-500"}>
                    {selectedProduct ? selectedProduct.title : "Select a product"}
                </span>
                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
            </button>

            {isOpen && !disabled && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-hidden">
                        {/* Search */}
                        <div className="p-3 border-b border-gray-200">
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search products..."
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Products List */}
                        <div className="overflow-y-auto max-h-80">
                            {loading ? (
                                <div className="py-8 text-center text-sm text-gray-500">
                                    Loading products...
                                </div>
                            ) : filteredProducts.length === 0 ? (
                                <div className="py-8 text-center text-sm text-gray-500">
                                    No products found
                                </div>
                            ) : (
                                filteredProducts.map((product) => (
                                    <button
                                        key={product.id}
                                        type="button"
                                        onClick={() => {
                                            onChange(product.id)
                                            setIsOpen(false)
                                            setSearch("")
                                        }}
                                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 transition-colors ${value === product.id ? "bg-gray-100" : ""
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {product.thumbnail && (
                                                <img
                                                    src={product.thumbnail}
                                                    alt={product.title}
                                                    className="w-10 h-10 object-cover rounded"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 truncate">
                                                    {product.title}
                                                </p>
                                                <p className="text-sm text-gray-500 truncate">
                                                    {product.handle}
                                                </p>
                                            </div>
                                            {value === product.id && (
                                                <div className="w-2 h-2 bg-gray-900 rounded-full" />
                                            )}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
