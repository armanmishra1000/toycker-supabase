"use client"

import { useState, useRef, useEffect } from "react"
import ReactCrop, { type Crop, type PixelCrop, } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { MagnifyingGlassIcon, SparklesIcon, PhotoIcon, CloudArrowUpIcon, CameraIcon } from "@heroicons/react/24/outline"
import { useImageSearchStore } from "@/lib/store/image-search-store"
import { useRouter } from "next/navigation"
import ProductPreview from "@modules/products/components/product-preview"
import { Product } from "@/lib/supabase/types"
import { ProductCardSkeleton } from "@modules/common/components/skeleton/product-grid-skeleton"

// Define types for results based on the API response
interface SearchProduct {
    id: string
    title: string
    handle: string
    thumbnail: string | null
    price: {
        amount: number
        currencyCode: string
        formatted: string
    }
    relevance_score: number
}

interface SearchResults {
    products: SearchProduct[]
    metadata: {
        total: number
    }
}

export default function VisualSearchInterface() {
    const router = useRouter()
    const { previewUrl, file, clear, setImage } = useImageSearchStore()
    const [crop, setCrop] = useState<Crop>()
    const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null)
    const [results, setResults] = useState<SearchResults | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [hasInteracted, setHasInteracted] = useState(false)
    const [isMounted, setIsMounted] = useState(false)
    const imgRef = useRef<HTMLImageElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setResults(null)
            setHasInteracted(false)
            setImage(selectedFile)
        }
    }

    const triggerFileInput = () => {
        fileInputRef.current?.click()
    }

    // Initialize crop when image loads
    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        const { width, height } = e.currentTarget

        // Trim 8 pixels from all sides
        const trim = 8
        const initialCrop: Crop = {
            unit: "px",
            x: trim,
            y: trim,
            width: width - (trim * 2),
            height: height - (trim * 2)
        }

        const initialPixelCrop: PixelCrop = {
            unit: 'px',
            x: trim,
            y: trim,
            width: width - (trim * 2),
            height: height - (trim * 2)
        }

        setCrop(initialCrop)
        setCompletedCrop(initialPixelCrop)

        // Auto-trigger trimmed search on load via the useEffect
        setHasInteracted(true)
    }

    const performSearch = async (forceFullImage = false, cropOverride?: PixelCrop) => {
        if (!file || !imgRef.current) return

        const targetCrop = cropOverride || completedCrop

        // If we are doing a crop search but no valid crop exists
        if (!forceFullImage && (!targetCrop || targetCrop.width <= 0)) return

        setLoading(true)
        setError(null)
        setHasInteracted(true)

        try {
            const image = imgRef.current
            const scaleX = image.naturalWidth / image.width
            const scaleY = image.naturalHeight / image.height

            const formData = new FormData()
            formData.append("image", file)

            if (forceFullImage) {
                // To search full image, we send the natural dimensions
                formData.append("x", "0")
                formData.append("y", "0")
                formData.append("width", image.naturalWidth.toString())
                formData.append("height", image.naturalHeight.toString())
            } else if (targetCrop) {
                formData.append("x", (targetCrop.x * scaleX).toString())
                formData.append("y", (targetCrop.y * scaleY).toString())
                formData.append("width", (targetCrop.width * scaleX).toString())
                formData.append("height", (targetCrop.height * scaleY).toString())
            }

            const response = await fetch("/api/storefront/search/image", {
                method: "POST",
                body: formData,
            })

            if (!response.ok) {
                const data = await response.json()
                if (data.error?.includes("PGRST202") || data.error?.includes("search_products_multimodal")) {
                    throw new Error("Database setup incomplete. Please run the SQL migration for multimodal search.")
                }
                throw new Error(data.error || "Search failed")
            }

            const data = await response.json()
            setResults(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    // Auto-search on crop completion ONLY after first interaction
    useEffect(() => {
        if (hasInteracted && completedCrop && completedCrop.width > 0 && completedCrop.height > 0) {
            const timer = setTimeout(() => performSearch(false), 500)
            return () => clearTimeout(timer)
        }
    }, [completedCrop, hasInteracted])

    if (!isMounted) return null

    if (!previewUrl) {
        return (
            <div className="flex flex-col items-center justify-center py-32 px-6">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                />
                <div className="max-w-md w-full text-center space-y-8">
                    <div className="space-y-4">
                        <div className="mx-auto w-24 h-24 bg-primary/5 rounded-3xl flex items-center justify-center ring-1 ring-primary/10">
                            <CloudArrowUpIcon className="h-12 w-12 text-primary" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Toy Finder</h2>
                        <p className="text-slate-500 text-lg">
                            Can't find the right words? Upload a photo to find matching toys instantly.
                        </p>
                    </div>

                    <div className="pt-4">
                        <button
                            onClick={triggerFileInput}
                            className="w-full sm:w-auto px-10 py-4 bg-primary text-white text-lg font-bold rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary/90 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-3 mx-auto"
                        >
                            <PhotoIcon className="w-6 h-6" />
                            Select an Image
                        </button>

                        <button
                            onClick={() => router.push("/")}
                            className="mt-6 text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            Or go back to home
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-[1400px] px-6 py-10">
            <div className="flex flex-col gap-10 lg:flex-row">
                {/* Left: Cropper Area (1 Column) */}
                <div className="w-full lg:w-1/4">
                    <div className="sticky top-24">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                    <SparklesIcon className="h-6 w-6 text-primary" />
                                    Toy Finder
                                </h1>
                                <p className="text-slate-500 text-sm mt-1">
                                    Adjust the selection to focus on a specific toy for better results.
                                </p>
                            </div>
                        </div>

                        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 shadow-inner flex justify-center items-center">
                            <ReactCrop
                                crop={crop}
                                onChange={(c: Crop) => {
                                    setCrop(c)
                                    setHasInteracted(true)
                                }}
                                onComplete={(c: PixelCrop) => setCompletedCrop(c)}
                                className="max-h-[70vh]"
                            >
                                <img
                                    ref={imgRef}
                                    src={previewUrl}
                                    alt="Source"
                                    onLoad={onImageLoad}
                                    style={{ display: "block", maxWidth: "100%", maxHeight: "70vh", height: "auto" }}
                                />
                            </ReactCrop>
                        </div>

                        <div className="mt-6">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept="image/*"
                                className="hidden"
                            />
                            <button
                                onClick={triggerFileInput}
                                className="w-full flex items-center justify-center gap-2.5 px-6 py-4 bg-white border-2 border-primary/20 rounded-2xl text-primary font-bold hover:bg-primary/5 hover:border-primary/40 transition-all group"
                            >
                                <CameraIcon className="w-6 h-6 transition-transform group-hover:scale-110" />
                                Select an Image
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Results Area (3 Columns) */}
                <div className="w-full lg:w-3/4">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-900">
                            {loading
                                ? "Searching..."
                                : results
                                    ? `${results.products.length} Results Found`
                                    : hasInteracted ? "Searching..." : "Your results will appear here"}
                        </h2>
                        {error && <span className="text-sm font-medium text-red-500">{error}</span>}
                    </div>

                    {!hasInteracted && (
                        <div className="flex flex-col items-center justify-center py-32 text-center opacity-40">
                            <MagnifyingGlassIcon className="h-16 w-16 mb-4" />
                            <p className="text-lg">Select a toy in the image to start searching</p>
                        </div>
                    )}

                    {results && results.products.length > 0 && !loading && (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {results.products.map((product) => (
                                <div key={product.id}>
                                    <ProductPreview
                                        product={{
                                            id: product.id,
                                            name: product.title,
                                            title: product.title,
                                            handle: product.handle,
                                            thumbnail: product.thumbnail,
                                            price: product.price.amount,
                                            currency_code: product.price.currencyCode,
                                            status: "active",
                                        } as unknown as Product}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {results && results.products.length === 0 && !loading && (
                        <div className="flex flex-col items-center justify-center py-32 text-center">
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 w-full">
                                <p className="text-lg font-semibold text-slate-900">No matches yet</p>
                                <p className="mt-2 text-sm text-slate-500">
                                    Try selecting a different part of the image or different lighting.
                                </p>
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {[...Array(6)].map((_, i) => (
                                <ProductCardSkeleton key={i} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
