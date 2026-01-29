"use client"

import { useEffect, useState, useTransition, useCallback } from "react"
import { ProductVariant, VariantFormData } from "@/lib/supabase/types"
import { deleteVariant, saveProductVariants } from "@/lib/data/admin"
import AdminCard from "./admin-card"
import { TrashIcon, PlusIcon, Sparkles, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@modules/common/context/toast-context"
import { cn } from "@lib/util/cn"
import { COLOR_SWATCH_MAP, STANDARD_COLORS } from "@/lib/constants/colors"
import VariantMediaPicker from "./variant-media-picker"

interface OptionDefinition {
    title: string
    values: string[]
}

export default function ProductVariantEditor({
    productId,
    initialVariants,
    productImages = []
}: {
    productId: string
    initialVariants: ProductVariant[]
    productImages?: string[]
}) {
    const router = useRouter()
    const { showToast } = useToast()
    const [isPending, startTransition] = useTransition()

    // Local state for variants
    const [variants, setVariants] = useState<VariantFormData[]>(
        initialVariants.map((v) => ({
            id: v.id,
            title: v.title,
            sku: v.sku || "",
            price: v.price,
            compare_at_price: v.compare_at_price || null,
            inventory_quantity: v.inventory_quantity,
            image_url: v.image_url || null,
        }))
    )

    // Option definition state for generation
    const [options, setOptions] = useState<OptionDefinition[]>([
        { title: "Color", values: [] },
        // { title: "Size", values: [] }
    ])
    const [openPickerIndex, setOpenPickerIndex] = useState<number | null>(null)

    // Sync local state when initialVariants prop changes
    useEffect(() => {
        setVariants(
            initialVariants.map((v) => ({
                id: v.id,
                title: v.title,
                sku: v.sku || "",
                price: v.price,
                compare_at_price: v.compare_at_price || null,
                inventory_quantity: v.inventory_quantity,
                image_url: v.image_url || null,
            }))
        )
    }, [initialVariants])

    const handleAddVariant = () => {
        setVariants([
            ...variants,
            {
                title: "",
                sku: "",
                price: 0,
                compare_at_price: null,
                inventory_quantity: 0,
                image_url: null,
            },
        ])
    }

    const handleRemoveVariant = async (index: number, id?: string) => {
        if (confirm("Are you sure you want to delete this variant?")) {
            if (id) {
                startTransition(async () => {
                    await deleteVariant(id)
                    const newVariants = [...variants]
                    newVariants.splice(index, 1)
                    setVariants(newVariants)
                    router.refresh()
                })
            } else {
                const newVariants = [...variants]
                newVariants.splice(index, 1)
                setVariants(newVariants)
            }
        }
    }

    const handleChange = (index: number, field: keyof VariantFormData, value: any) => {
        const newVariants = [...variants]
        newVariants[index] = { ...newVariants[index], [field]: value }
        setVariants(newVariants)
    }

    const handleSave = () => {
        startTransition(async () => {
            try {
                // Pre-save validation: Check for duplicate SKUs
                const skus = variants.map(v => v.sku).filter(Boolean)
                const uniqueSkus = new Set(skus)
                if (skus.length !== uniqueSkus.size) {
                    showToast("Multiple variants cannot have the same SKU.", "error", "Duplicate SKUs")
                    return
                }

                await saveProductVariants(productId, variants)
                showToast("Product variants updated successfully.", "success", "Changes Saved")
                router.refresh()
            } catch (error) {
                console.error(error)
                showToast("Failed to save changes. Please try again.", "error", "Save Failed")
            }
        })
    }

    // Option Generation Logic
    const handleUpdateOption = (idx: number, field: keyof OptionDefinition, value: any) => {
        const nextOptions = [...options]
        let processedValue = value

        // Auto-capitalize values if it's the values field
        if (field === "values" && Array.isArray(processedValue)) {
            processedValue = processedValue.map(v =>
                typeof v === "string" ? v.toUpperCase() : v
            )
        }

        // @ts-ignore
        nextOptions[idx] = { ...nextOptions[idx], [field]: processedValue }
        setOptions(nextOptions)
    }

    const handleRemoveOption = (idx: number) => {
        if (options.length <= 1) return // Keep at least one
        const nextOptions = options.filter((_, i) => i !== idx)
        setOptions(nextOptions)
    }

    const handleGenerate = useCallback(() => {
        const validOptions = options.filter(o => o.title && o.values.length > 0)
        if (validOptions.length === 0) return

        // Cartesian product helper
        const cartesian = (...a: any[]) => a.reduce((a, b) => a.flatMap((d: any) => b.map((e: any) => [d, e].flat())))

        const combinations = validOptions.length === 1
            ? validOptions[0].values.map(v => [v])
            : cartesian(...validOptions.map(o => o.values))

        const newVariants: VariantFormData[] = combinations.map((combo: string[]) => {
            const title = combo.join(" / ")
            // Check if this variant title already exists to avoid overwriting existing data
            const existing = variants.find(v => v.title === title)
            if (existing) return existing

            return {
                title,
                sku: "",
                price: 0,
                compare_at_price: null,
                inventory_quantity: 0,
                image_url: null
            }
        })

        setVariants([...newVariants])
        showToast(`Generated ${newVariants.length} variants based on your options.`, "success", "Generation Complete")
    }, [options, variants, showToast])

    const handleBulkPrice = () => {
        const price = prompt("Enter selling price for all variants:")
        if (price === null) return
        const p = parseFloat(price)
        if (isNaN(p)) return

        setVariants(variants.map(v => ({ ...v, price: p })))
    }

    return (
        <AdminCard title={`Product Variants (${variants.length})`}>
            <div className="space-y-6">
                {/* Variant Option Generator Section */}
                <div className="p-4 border border-gray-200 rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-purple-500" />
                            <h3 className="text-xs font-black text-gray-700 uppercase tracking-widest">Variant Generator</h3>
                        </div>
                        <button
                            type="button"
                            onClick={() => setOptions([...options, { title: "", values: [] }])}
                            className="text-[10px] font-bold text-blue-600 hover:underline"
                        >
                            + Add another option
                        </button>
                    </div>

                    <div className="space-y-3">
                        {options.map((opt, idx) => (
                            <div key={idx} className="flex flex-col md:flex-row items-start md:items-center gap-3">
                                <div className="w-full md:w-1/3">
                                    <input
                                        type="text"
                                        placeholder="Option Title (e.g. Size)"
                                        value={opt.title}
                                        onChange={(e) => handleUpdateOption(idx, "title", e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium focus:border-black focus:ring-0 transition-all bg-gray-50/30"
                                    />
                                </div>
                                <div className="flex-1 w-full relative group/val">
                                    <input
                                        type="text"
                                        placeholder="Values (comma separated: S, M, L)"
                                        value={opt.values.join(", ")}
                                        onChange={(e) => handleUpdateOption(idx, "values", e.target.value.split(",").map(v => v.trim()).filter(Boolean))}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium focus:border-black focus:ring-0 transition-all bg-gray-50/30"
                                    />
                                    {opt.title.toLowerCase().includes("color") && (
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => setOpenPickerIndex(openPickerIndex === idx ? null : idx)}
                                                className="p-1 hover:bg-gray-100 rounded transition-all text-gray-400 hover:text-black opacity-0 group-hover/val:opacity-100"
                                                title="Pick standard colors"
                                            >
                                                <ChevronDown className={cn("h-4 w-4 transition-transform", openPickerIndex === idx && "rotate-180 text-black")} />
                                            </button>
                                        </div>
                                    )}

                                    {openPickerIndex === idx && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-10"
                                                onClick={() => setOpenPickerIndex(null)}
                                            />
                                            <div className="absolute top-full right-0 mt-1 z-20 pt-1 animate-in fade-in zoom-in-95 duration-100">
                                                <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-2 min-w-[220px]">
                                                    <div className="p-2 border-b border-gray-50 mb-1 flex justify-between items-center">
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Expanded Library</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => setOpenPickerIndex(null)}
                                                            className="text-[10px] text-gray-300 hover:text-black font-bold"
                                                        >
                                                            Done
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-5 gap-1.5 p-1">
                                                        {STANDARD_COLORS.map((color) => {
                                                            const colorKey = color.toLowerCase().replace(/ /g, '')
                                                            const hexColor = COLOR_SWATCH_MAP[colorKey] || colorKey

                                                            return (
                                                                <button
                                                                    key={color}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const currentValues = [...opt.values]
                                                                        if (!currentValues.includes(color)) {
                                                                            handleUpdateOption(idx, "values", [...currentValues, color])
                                                                        }
                                                                    }}
                                                                    className="w-full aspect-square rounded-md border border-gray-100 shadow-sm flex items-center justify-center hover:scale-125 hover:z-10 transition-all duration-200"
                                                                    style={{ backgroundColor: hexColor }}
                                                                    title={color}
                                                                />
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveOption(idx)}
                                    className="p-2 border border-transparent hover:bg-red-50 hover:border-red-100 rounded-lg text-gray-400 hover:text-red-500 transition-all md:self-center"
                                    title="Remove option"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="button"
                            onClick={handleGenerate}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-xs font-bold rounded-lg hover:border-black transition-all shadow-sm group"
                        >
                            <Sparkles className="h-3 w-3 text-purple-500 group-hover:scale-110 transition-transform" />
                            Generate Combinations
                        </button>
                    </div>
                </div>

                {/* Bulk Actions */}
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleBulkPrice}
                        className="text-[10px] font-bold text-gray-400 hover:text-black uppercase tracking-widest px-3 py-1.5 border border-gray-200 rounded-md hover:border-gray-300 transition-all"
                    >
                        Set all prices
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            const price = prompt("Enter MRP (Compare at Price) for all variants:")
                            if (price === null) return
                            const p = parseFloat(price)
                            if (isNaN(p)) return
                            setVariants(variants.map(v => ({ ...v, compare_at_price: p })))
                        }}
                        className="text-[10px] font-bold text-gray-400 hover:text-black uppercase tracking-widest px-3 py-1.5 border border-gray-200 rounded-md hover:border-gray-300 transition-all"
                    >
                        Set all MRP
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            const quantity = prompt("Enter stock quantity for all variants:")
                            if (quantity === null) return
                            const q = parseInt(quantity)
                            if (isNaN(q)) return
                            setVariants(variants.map(v => ({ ...v, inventory_quantity: q })))
                        }}
                        className="text-[10px] font-bold text-gray-400 hover:text-black uppercase tracking-widest px-3 py-1.5 border border-gray-200 rounded-md hover:border-gray-300 transition-all"
                    >
                        Set all stock
                    </button>
                </div>

                {/* Variants Table */}
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#f7f8f9] text-gray-400 font-black text-[10px] border-b border-gray-200 uppercase tracking-widest">
                            <tr>
                                <th className="px-4 py-4 w-[60px]">Media</th>
                                <th className="px-4 py-4 min-w-[150px]">Title / Option</th>
                                <th className="px-4 py-4 w-[120px]">SKU</th>
                                <th className="px-4 py-4 w-[110px] text-right">Price</th>
                                <th className="px-4 py-4 w-[110px] text-right">MRP</th>
                                <th className="px-4 py-4 w-[80px] text-right">Stock</th>
                                <th className="px-4 py-4 w-[40px]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {variants.map((variant, index) => (
                                <tr key={index} className="bg-white group hover:bg-gray-50/50 transition-colors">
                                    <td className="p-3">
                                        <VariantMediaPicker
                                            images={productImages}
                                            selectedImage={variant.image_url || null}
                                            onSelect={(url) => handleChange(index, "image_url", url)}
                                        />
                                    </td>
                                    <td className="p-3">
                                        <input
                                            type="text"
                                            className="w-full bg-transparent border-none rounded-md text-sm font-semibold focus:ring-0 placeholder:text-gray-300"
                                            placeholder="e.g. Red / XL"
                                            value={variant.title}
                                            onChange={(e) => handleChange(index, "title", e.target.value)}
                                        />
                                    </td>
                                    <td className="p-3">
                                        <input
                                            type="text"
                                            className="w-full bg-transparent border-none rounded-md text-[11px] font-mono font-medium focus:ring-0 placeholder:text-gray-300 uppercase"
                                            placeholder="SKU-123"
                                            value={variant.sku}
                                            onChange={(e) => handleChange(index, "sku", e.target.value)}
                                        />
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center justify-end">
                                            <span className="text-gray-400 mr-1 font-bold">₹</span>
                                            <input
                                                type="number"
                                                className="w-16 bg-transparent border-none rounded-md text-sm font-black text-right focus:ring-0"
                                                value={variant.price}
                                                onChange={(e) => handleChange(index, "price", e.target.value === "" ? 0 : parseFloat(e.target.value))}
                                            />
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center justify-end">
                                            <span className="text-gray-400 mr-1 font-medium">₹</span>
                                            <input
                                                type="number"
                                                className="w-16 bg-transparent border-none rounded-md text-sm font-medium text-gray-500 text-right focus:ring-0"
                                                placeholder="0"
                                                value={variant.compare_at_price || ""}
                                                onChange={(e) => handleChange(index, "compare_at_price", e.target.value === "" ? null : parseFloat(e.target.value))}
                                            />
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <input
                                            type="number"
                                            className={cn(
                                                "w-full bg-transparent border-none rounded-md text-sm font-bold text-right focus:ring-0",
                                                variant.inventory_quantity === 0 ? "text-red-500" : "text-gray-900"
                                            )}
                                            placeholder="0"
                                            value={variant.inventory_quantity}
                                            onChange={(e) => handleChange(index, "inventory_quantity", e.target.value === "" ? 0 : parseInt(e.target.value))}
                                        />
                                    </td>
                                    <td className="p-3 text-center">
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveVariant(index, variant.id)}
                                            className="text-gray-300 hover:text-red-500 transition-colors p-1.5"
                                            disabled={isPending}
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {variants.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-gray-300 italic">
                                        No variants defined. Use the generator above or add manually.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-between items-center pt-2">
                    <button
                        type="button"
                        onClick={handleAddVariant}
                        className="flex items-center gap-2 text-xs font-black text-gray-400 hover:text-black uppercase tracking-widest transition-colors"
                    >
                        <PlusIcon className="h-3.5 w-3.5" />
                        Add Manually
                    </button>

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isPending}
                        className="px-6 py-2.5 bg-black text-white text-xs font-black rounded-xl hover:bg-gray-800 transition-all shadow-xl shadow-black/10 active:scale-95 disabled:opacity-50 uppercase tracking-widest"
                    >
                        {isPending ? "Syncing..." : "Save Variants"}
                    </button>
                </div>
            </div>
        </AdminCard>
    )
}
