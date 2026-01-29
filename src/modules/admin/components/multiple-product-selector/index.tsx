"use client"

import { useState, useEffect } from "react"
import { ChevronDownIcon, MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline"
import { PlusCircle, ShoppingBag, Trash2, Search, Layers } from "lucide-react"
import { cn } from "@/lib/util/cn"

type Product = {
    id: string
    title: string
    handle: string
    thumbnail: string | null
}

type Props = {
    selectedIds: string[]
    initialProducts?: Product[]
    onChange: (_productIds: string[]) => void
    name?: string
    disabled?: boolean
}

export default function MultipleProductSelector({
    selectedIds,
    initialProducts = [],
    onChange,
    name = "related_product_ids",
    disabled = false
}: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const [products, setProducts] = useState<Product[]>(initialProducts)
    const [search, setSearch] = useState("")
    const [loading, setLoading] = useState(false)
    const [hasLoadedFull, setHasLoadedFull] = useState(false)

    useEffect(() => {
        const loadProducts = async () => {
            setLoading(true)
            try {
                const response = await fetch("/api/products")
                if (response.ok) {
                    const data = await response.json()
                    const fetchedProducts = data.products || []

                    // Merge with initial products, avoiding duplicates
                    setProducts(prev => {
                        const existingIds = new Set(prev.map(p => p.id))
                        const newOnes = fetchedProducts.filter((p: Product) => !existingIds.has(p.id))
                        return [...prev, ...newOnes]
                    })
                    setHasLoadedFull(true)
                }
            } catch (error) {
                console.error("Error loading products:", error)
            } finally {
                setLoading(false)
            }
        }

        if (isOpen && !hasLoadedFull && !loading) {
            loadProducts()
        }
    }, [isOpen, hasLoadedFull, loading])

    const filteredProducts = products.filter((product) =>
        (product.title.toLowerCase().includes(search.toLowerCase()) ||
            product.handle.toLowerCase().includes(search.toLowerCase())) &&
        !selectedIds.includes(product.id)
    )

    const toggleProduct = (productId: string) => {
        if (selectedIds.includes(productId)) {
            onChange(selectedIds.filter(id => id !== productId))
        } else {
            if (selectedIds.length >= 2) return
            onChange([...selectedIds, productId])
        }
    }

    const removeProduct = (productId: string) => {
        onChange(selectedIds.filter(id => id !== productId))
    }

    return (
        <div className="space-y-4">
            <div className="relative">
                <button
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    className={`w-full flex items-center justify-between px-5 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-black hover:shadow-lg transition-all duration-300 group ${disabled ? "bg-gray-50 cursor-not-allowed opacity-60" : ""
                        }`}
                >
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "p-2 rounded-xl transition-colors duration-300",
                            isOpen ? "bg-black text-white" : "bg-gray-50 text-gray-400 group-hover:bg-black group-hover:text-white"
                        )}>
                            <PlusCircle className="h-5 w-5" />
                        </div>
                        <span className={cn(
                            "text-sm font-black uppercase tracking-widest transition-colors duration-300",
                            isOpen ? "text-black" : "text-gray-500 group-hover:text-black"
                        )}>
                            {isOpen ? "Close Selector" : "Add Related Products"}
                        </span>
                    </div>
                    <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform duration-500 ${isOpen ? "rotate-180 text-black" : "group-hover:text-black"}`} />
                </button>

                {isOpen && !disabled && (
                    <div className="mt-4 bg-white border border-gray-100 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.08)] max-h-[500px] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="p-5 border-b border-gray-50 bg-gray-50/50">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-black transition-colors" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by name or handle..."
                                    className="w-full pl-12 pr-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-0 focus:border-black text-sm font-bold shadow-sm transition-all placeholder:text-gray-300"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="overflow-y-auto max-h-[380px] custom-scrollbar py-3">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-4">
                                    <div className="w-10 h-10 border-4 border-gray-100 border-t-black rounded-full animate-spin shadow-sm" />
                                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] animate-pulse">Scanning Store Catalog...</p>
                                </div>
                            ) : filteredProducts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 opacity-30 gap-3">
                                    <ShoppingBag className="w-12 h-12 text-gray-400" />
                                    <p className="text-[11px] font-black text-gray-500 uppercase tracking-[0.3em]">Empty result</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-1.5 px-3">
                                    {filteredProducts.map((product) => (
                                        <button
                                            key={product.id}
                                            type="button"
                                            onClick={() => toggleProduct(product.id)}
                                            className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 rounded-[1.5rem] transition-all group relative border border-transparent hover:border-gray-100"
                                        >
                                            <div className="relative h-14 w-14 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 shadow-sm transition-transform duration-300 group-hover:scale-105">
                                                {product.thumbnail ? (
                                                    <img
                                                        src={product.thumbnail}
                                                        alt={product.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <ShoppingBag className="w-6 h-6" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                                    {product.title}
                                                </p>
                                                <p className="text-[10px] text-gray-400 font-mono mt-1 uppercase tracking-tighter bg-gray-50 inline-block px-1.5 py-0.5 rounded border border-gray-100">
                                                    {product.handle}
                                                </p>
                                            </div>
                                            <div className={cn(
                                                "transition-all transform translate-x-2 group-hover:translate-x-0",
                                                selectedIds.length >= 2 ? "opacity-30 grayscale cursor-not-allowed" : "opacity-0 group-hover:opacity-100"
                                            )}>
                                                <div className={cn(
                                                    "px-4 py-2 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg transition-all",
                                                    selectedIds.length >= 2 ? "bg-gray-400" : "bg-black shadow-black/20 hover:bg-gray-800 active:scale-95"
                                                )}>
                                                    {selectedIds.length >= 2 ? "Full" : "Select"}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Selected Products List */}
            {selectedIds.length > 0 && (
                <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-5 space-y-5 animate-in fade-in duration-500 shadow-sm">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2.5">
                            <Layers className="w-4 h-4 text-black" />
                            <h3 className="text-[11px] font-black text-black uppercase tracking-[0.2em]">Bundle Selection</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-500 bg-white border border-gray-100 px-2.5 py-1 rounded-lg shadow-sm">
                                {selectedIds.length} {selectedIds.length === 1 ? 'item' : 'items'}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                        {selectedIds.map(id => {
                            const p = products.find(prod => prod.id === id)
                            return (
                                <div key={id} className="group relative flex items-center justify-between bg-white p-3.5 rounded-xl border border-gray-200/50 shadow-sm hover:shadow-md hover:border-black/10 transition-all duration-300 animate-in slide-in-from-left-2">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105">
                                            {p?.thumbnail ? (
                                                <img src={p.thumbnail} className="w-full h-full object-cover" alt={p.title || "Product"} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-200">
                                                    <ShoppingBag className="w-5 h-5" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-black text-gray-900 truncate max-w-[280px] group-hover:text-blue-600 transition-colors">
                                                {p?.title || "Loading Product..."}
                                            </span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[9px] text-gray-400 font-mono uppercase tracking-tighter bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                                    {id}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => removeProduct(id)}
                                        className="p-2.5 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm group-hover:shadow hover:scale-110 active:scale-95"
                                        title="Remove from bundle"
                                    >
                                        <Trash2 className="h-4.5 w-4.5" />
                                    </button>
                                    <input type="hidden" name={name} value={id} />
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Signal that this field is present, even if empty, so the server knows to clear if none selected */}
            <input type="hidden" name={`${name}_present`} value="1" />
        </div>
    )
}
