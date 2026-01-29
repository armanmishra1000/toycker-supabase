"use client"

import { useState, useMemo, useTransition } from "react"
import { Product } from "@/lib/supabase/types"
import { buildDisplayPrice } from "@lib/util/display-price"
import { getProductPrice } from "@lib/util/get-product-price"
import { Button } from "@modules/common/components/button"
import { useCartSidebar } from "@modules/layout/context/cart-sidebar-context"
import { useCartStore } from "@modules/cart/context/cart-store-context"
import { Plus, Check, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@lib/util/cn"
import ProductPreview from "@modules/products/components/product-preview"

type FrequentlyBoughtTogetherProps = {
    product: Product
    clubDiscountPercentage?: number
}

export default function FrequentlyBoughtTogether({
    product,
    clubDiscountPercentage
}: FrequentlyBoughtTogetherProps) {
    const { openCart } = useCartSidebar()
    const { optimisticAddMultiple } = useCartStore()
    const [isAdding, startTransition] = useTransition()
    const [isMobileExpanded, setIsMobileExpanded] = useState(true)

    // Get related products from the pre-fetched combinations
    const relatedItems = useMemo(() => {
        return (product.related_combinations || []).map(c => c.related_product).filter(Boolean)
    }, [product.related_combinations])

    if (relatedItems.length === 0) {
        return null
    }

    // All products in the bundle (main + related)
    const allProducts = useMemo(() => [product, ...relatedItems], [product, relatedItems])

    // Track which products are selected
    const [selectedIds, setSelectedIds] = useState<string[]>(allProducts.map(p => p.id))

    const toggleProduct = (id: string) => {
        if (id === product.id) return // Always keep main product selected
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        )
    }

    const totalPrice = useMemo(() => {
        return allProducts
            .filter(p => selectedIds.includes(p.id))
            .reduce((sum, p) => {
                const price = getProductPrice({ product: p, clubDiscountPercentage })
                const targetPrice = price.variantPrice || price.cheapestPrice
                const priceAmount = (clubDiscountPercentage && targetPrice?.club_price_number)
                    ? targetPrice.club_price_number
                    : (targetPrice?.calculated_price_number || 0)
                return sum + priceAmount
            }, 0)
    }, [allProducts, selectedIds, clubDiscountPercentage])

    const displayTotalPrice = buildDisplayPrice({
        calculated_price_number: totalPrice,
        calculated_price: "",
        currency_code: product.currency_code || "inr"
    } as any)

    const handleAddBundle = () => {
        if (isAdding || selectedIds.length === 0) return

        const itemsTooptimisticallyAdd = allProducts
            .filter(p => selectedIds.includes(p.id))
            .map(p => ({
                product: p,
                variant: p.variants?.[0], // simple assumption for bundle
                quantity: 1,
                countryCode: "in", // default
            }))

        startTransition(async () => {
            try {
                // Use the new multi-add method which handles both UI and Server
                await optimisticAddMultiple(itemsTooptimisticallyAdd)
                openCart()
            } catch (error) {
                console.error("Failed to add bundle to cart:", error)
            }
        })
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Mobile Header (Accordion Trigger) */}
            <div
                className="flex sm:hidden items-center justify-between p-2 cursor-pointer"
                onClick={() => setIsMobileExpanded(!isMobileExpanded)}
            >
                <h2 className="text-xl font-bold text-slate-800">Frequently Bought Together</h2>
                <div className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-lg">
                    {isMobileExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
            </div>

            <div className={cn(
                "border border-gray-200 rounded-2xl overflow-hidden transition-all duration-300",
                !isMobileExpanded && "sm:border sm:rounded-2xl border-none p-0"
            )}>
                {/* Desktop View */}
                <div className={cn(
                    "hidden sm:flex flex-col gap-10 p-4 lg:p-8",
                    !isMobileExpanded && "sm:flex" // Desktop always shows unless we want accordion there too
                )}>
                    <div className="flex flex-col gap-3 text-center sm:text-left">
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">Frequently Bought Together</h2>
                        <p className="text-sm text-slate-500 font-medium tracking-tight">Handpicked combinations to make your experience complete.</p>
                    </div>

                    <div className="flex flex-col xl:flex-row items-stretch xl:items-end gap-10 lg:gap-16">
                        {/* Products List */}
                        <div className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-center sm:justify-start gap-y-12 sm:gap-x-6 lg:gap-x-10 flex-1">
                            {allProducts.map((p, index) => {
                                const isSelected = selectedIds.includes(p.id)
                                const isMainProduct = p.id === product.id

                                return (
                                    <div key={p.id} className="flex flex-col sm:flex-row items-center gap-8 sm:gap-6 lg:gap-10 w-full sm:w-auto">
                                        <div className="flex flex-col items-center gap-3 w-full sm:w-[180px]">
                                            <div className="relative group transition-all duration-300 w-full max-w-[200px] sm:max-w-none">
                                                {/* Standard Product Card */}
                                                <div className="pointer-events-auto">
                                                    <ProductPreview
                                                        product={p}
                                                        clubDiscountPercentage={clubDiscountPercentage}
                                                        viewMode="grid-5"
                                                        showAction={false}
                                                        isMinimal={true}
                                                    />
                                                </div>

                                                {/* Selection Overlay (Clickable area for toggling) */}
                                                {!isMainProduct && (
                                                    <div
                                                        onClick={() => toggleProduct(p.id)}
                                                        className="absolute inset-0 z-20 cursor-pointer"
                                                    />
                                                )}

                                                {/* Checkbox Overlay */}
                                                <button
                                                    onClick={() => !isMainProduct && toggleProduct(p.id)}
                                                    disabled={isMainProduct}
                                                    className={cn(
                                                        "absolute top-4 right-4 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all shadow-md z-30",
                                                        isSelected
                                                            ? "bg-[#E7353A] border-white text-white scale-110"
                                                            : "bg-white/90 border-slate-200 text-slate-200 backdrop-blur-sm",
                                                        isMainProduct && "cursor-default opacity-90 shadow-none border-white/50"
                                                    )}
                                                >
                                                    <Check className={cn("w-5 h-5 transition-transform", isSelected ? "scale-100" : "scale-0")} strokeWidth={4} />
                                                </button>
                                            </div>
                                        </div>

                                        {index < allProducts.length - 1 && (
                                            <div className="flex items-center justify-center">
                                                <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-300 shadow-sm rotate-90 sm:rotate-0">
                                                    <Plus className="w-6 h-6" strokeWidth={3} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        {/* Checkout Info */}
                        <div className="w-full xl:w-[350px] bg-white rounded-2xl p-8 border border-gray-200 flex flex-col gap-6">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total for {selectedIds.length} items</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-[#E7353A] tracking-tight">{displayTotalPrice?.current.raw}</span>
                                </div>
                            </div>

                            <Button
                                onClick={handleAddBundle}
                                disabled={isAdding || selectedIds.length === 0}
                                variant="transparent"
                                className={cn(
                                    "w-full h-18 rounded-full text-base transition-all duration-300 hover:bg-[#d52c34]",
                                    selectedIds.length > 0
                                        ? "bg-[#E7353A] text-white"
                                        : "bg-slate-100 text-slate-300 cursor-not-allowed"
                                )}
                            >
                                {isAdding ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Adding Bundle...</span>
                                    </div>
                                ) : (
                                    <span>Add {selectedIds.length} Items to Cart</span>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Mobile Specific List View */}
                {isMobileExpanded && (
                    <div className="sm:hidden flex flex-col p-3 gap-0">
                        {allProducts.map((p, index) => {
                            const isSelected = selectedIds.includes(p.id)
                            const isMainProduct = p.id === product.id
                            const { cheapestPrice } = getProductPrice({ product: p, clubDiscountPercentage })

                            return (
                                <div
                                    key={p.id}
                                    className={cn(
                                        "flex items-center gap-4 py-4 border-b border-gray-100 last:border-0",
                                        isMainProduct && " "
                                    )}
                                >
                                    {/* Thumbnail */}
                                    <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-100 bg-white shrink-0">
                                        <img
                                            src={p.thumbnail || p.image_url || "/placeholder.jpg"}
                                            alt={p.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                                        <h3 className="text-sm font-bold text-slate-800 line-clamp-2 leading-tight">
                                            {p.name}
                                        </h3>
                                        <div className="flex flex-col gap-0.5 mt-1">
                                            <div className="flex items-center gap-2">
                                                {cheapestPrice?.calculated_price && (
                                                    <span className="text-sm font-black text-slate-900">{cheapestPrice.calculated_price}</span>
                                                )}
                                                {cheapestPrice?.original_price && Number(cheapestPrice.percentage_diff) > 0 && (
                                                    <span className="text-[10px] text-slate-400 line-through">{cheapestPrice.original_price}</span>
                                                )}
                                                {Number(cheapestPrice?.percentage_diff) > 0 && (
                                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 italic">
                                                        {cheapestPrice?.percentage_diff}% OFF
                                                    </span>
                                                )}
                                            </div>
                                            {cheapestPrice?.club_price && (
                                                <span className="text-xs font-bold text-emerald-700">
                                                    Club Price: {cheapestPrice.club_price}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action (Red Circle Checkbox like Desktop) */}
                                    <div className="shrink-0">
                                        <button
                                            onClick={() => !isMainProduct && toggleProduct(p.id)}
                                            disabled={isMainProduct}
                                            className={cn(
                                                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shadow-sm",
                                                isSelected
                                                    ? "bg-[#E7353A] border-[#E7353A] text-white"
                                                    : "bg-white border-slate-200 text-slate-200",
                                                isMainProduct && "cursor-default opacity-100"
                                            )}
                                        >
                                            <Check className={cn("w-4 h-4 transition-transform", isSelected ? "scale-100" : "scale-0")} strokeWidth={4} />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}

                        {/* Mobile Footer Button */}
                        <Button
                            onClick={handleAddBundle}
                            disabled={isAdding || selectedIds.length === 0}
                            variant="transparent"
                            className={cn(
                                "w-full h-14 rounded-xl text-sm font-bold transition-all duration-300",
                                selectedIds.length > 0
                                    ? "bg-[#E7353A] text-white active:bg-[#E7353A] hover:bg-[#d52c34]"
                                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            )}
                        >
                            {isAdding ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <span>{selectedIds.length === 1 ? `Add 1 item to cart` : `Add ${selectedIds.length} items to cart`}</span>
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
