"use client"

import { useEffect, useState, useTransition } from "react"
import { ProductVariant, VariantFormData } from "@/lib/supabase/types"
import { deleteVariant, saveProductVariants } from "@/lib/data/admin"
import AdminCard from "./admin-card"
import { TrashIcon, PlusIcon } from "@heroicons/react/24/outline"
import { useRouter } from "next/navigation"
import { useToast } from "@modules/common/context/toast-context"

export default function ProductVariantEditor({
    productId,
    initialVariants
}: {
    productId: string
    initialVariants: ProductVariant[]
}) {
    const router = useRouter()
    const { showToast } = useToast()
    const [isPending, startTransition] = useTransition()
    // Local state for the form variants
    const [variants, setVariants] = useState<VariantFormData[]>(
        initialVariants.map((v) => ({
            id: v.id,
            title: v.title,
            sku: v.sku || "",
            price: v.price,
            compare_at_price: v.compare_at_price || null,
            inventory_quantity: v.inventory_quantity,
        }))
    )

    // Sync local state when initialVariants prop changes (e.g. after a refresh)
    useEffect(() => {
        setVariants(
            initialVariants.map((v) => ({
                id: v.id,
                title: v.title,
                sku: v.sku || "",
                price: v.price,
                compare_at_price: v.compare_at_price || null,
                inventory_quantity: v.inventory_quantity,
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
            },
        ])
    }

    const handleRemoveVariant = async (index: number, id?: string) => {
        if (confirm("Are you sure you want to delete this variant?")) {
            if (id) {
                startTransition(async () => {
                    await deleteVariant(id)
                    // Also remove from local state
                    const newVariants = [...variants]
                    newVariants.splice(index, 1)
                    setVariants(newVariants)
                    router.refresh()
                })
            } else {
                // Just remove from local state if not saved yet
                const newVariants = [...variants]
                newVariants.splice(index, 1)
                setVariants(newVariants)
            }
        }
    }

    const handleChange = (index: number, field: keyof VariantFormData, value: string | number | null) => {
        const newVariants = [...variants]
        newVariants[index] = { ...newVariants[index], [field]: value }
        setVariants(newVariants)
    }

    const handleSave = () => {
        startTransition(async () => {
            try {
                await saveProductVariants(productId, variants)
                showToast("The product variants have been successfully updated.", "success", "Changes Saved")
                router.refresh()
            } catch (error) {
                console.error(error)
                showToast("There was a problem saving your changes. Please try again.", "error", "Save Failed")
            }
        })
    }

    return (
        <AdminCard title={`Product Variants (${variants.length})`}>
            <div className="space-y-4">
                <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                            <tr>
                                <th className="px-4 py-3 min-w-[150px]">Title / Option</th>
                                <th className="px-4 py-3 w-[150px]">SKU</th>
                                <th className="px-4 py-3 w-[120px]">Selling Price</th>
                                <th className="px-4 py-3 w-[120px]">MRP</th>
                                <th className="px-4 py-3 w-[100px]">Stock</th>
                                <th className="px-4 py-3 w-[50px]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {variants.map((variant, index) => (
                                <tr key={index} className="bg-white">
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            className="w-full border-gray-300 rounded-md text-sm focus:ring-black focus:border-black"
                                            placeholder="e.g. Red / Large"
                                            value={variant.title}
                                            onChange={(e) => handleChange(index, "title", e.target.value)}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            className="w-full border-gray-300 rounded-md text-sm focus:ring-black focus:border-black"
                                            placeholder="SKU-123"
                                            value={variant.sku}
                                            onChange={(e) => handleChange(index, "sku", e.target.value)}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="number"
                                            className="w-full border-gray-300 rounded-md text-sm focus:ring-black focus:border-black"
                                            placeholder="0.00"
                                            value={variant.price}
                                            onChange={(e) => handleChange(index, "price", e.target.value === "" ? 0 : parseFloat(e.target.value))}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="number"
                                            className="w-full border-gray-300 rounded-md text-sm focus:ring-black focus:border-black"
                                            placeholder="Optional"
                                            value={variant.compare_at_price || ""}
                                            onChange={(e) => handleChange(index, "compare_at_price", e.target.value === "" ? null : parseFloat(e.target.value))}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="number"
                                            className="w-full border-gray-300 rounded-md text-sm focus:ring-black focus:border-black"
                                            placeholder="0"
                                            value={variant.inventory_quantity}
                                            onChange={(e) => handleChange(index, "inventory_quantity", e.target.value === "" ? 0 : parseInt(e.target.value))}
                                        />
                                    </td>
                                    <td className="p-2 text-center">
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveVariant(index, variant.id)}
                                            className="text-red-500 hover:text-red-700 transition-colors p-1"
                                            disabled={isPending}
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {variants.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-400 italic">
                                        No variants yet. Add one to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-between items-center">
                    <button
                        type="button"
                        onClick={handleAddVariant}
                        className="flex items-center text-sm font-medium text-gray-600 hover:text-black transition-colors"
                    >
                        <PlusIcon className="h-4 w-4 mr-1.5" />
                        Add Variant
                    </button>

                    <button
                        type="button" // Important: type button so it doesn't trigger parent form submit if nested
                        onClick={handleSave}
                        disabled={isPending}
                        className="px-4 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPending ? "Saving..." : "Save Variants"}
                    </button>
                </div>
            </div>
        </AdminCard>
    )
}
