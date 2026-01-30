"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Globe, Edit2, Link2, Link2Off } from "lucide-react"
import AdminCard from "./admin-card"
import { SubmitButton } from "./submit-button"
import CatalogImageSection from "./catalog-image-section"
import { ProductCheckboxList } from "./product-checkbox-list"
import { slugify } from "@/lib/util/slug"
import { cn } from "@/lib/util/cn"

type CategoryFormProps = {
    category?: {
        id: string
        name: string
        handle: string
        description: string | null
        image_url: string | null
    }
    products: any[]
    selectedProductIds?: string[]
    action: (formData: FormData) => Promise<any>
}

export function CategoryForm({ category, products, selectedProductIds = [], action }: CategoryFormProps) {
    const [name, setName] = useState(category?.name || "")
    const [handle, setHandle] = useState(category?.handle || "")
    const [isHandleManuallyEdited, setIsHandleManuallyEdited] = useState(false)
    const [isEditingHandle, setIsEditingHandle] = useState(false)

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value
        setName(newName)
        if (!isHandleManuallyEdited) {
            setHandle(slugify(newName))
        }
    }

    const handleHandleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setHandle(e.target.value)
        setIsHandleManuallyEdited(true)
    }

    const toggleSync = () => {
        const nextState = !isHandleManuallyEdited
        setIsHandleManuallyEdited(nextState)
        if (!nextState) {
            // If we're enabling sync, update handle to current name slug
            setHandle(slugify(name))
        }
    }

    return (
        <form action={action}>
            {category?.id && <input type="hidden" name="id" value={category.id} />}
            <input type="hidden" name="handle" value={handle} />

            <AdminCard title="General Information">
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm font-semibold text-gray-700">Name</label>
                                <button
                                    type="button"
                                    onClick={toggleSync}
                                    className={cn(
                                        "flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold transition-all",
                                        !isHandleManuallyEdited
                                            ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                                            : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                                    )}
                                    title={!isHandleManuallyEdited ? "Handle is synced with name" : "Handle sync is disabled"}
                                >
                                    {!isHandleManuallyEdited ? (
                                        <><Link2 className="h-3 w-3" /> Auto-sync On</>
                                    ) : (
                                        <><Link2Off className="h-3 w-3" /> Auto-sync Off</>
                                    )}
                                </button>
                            </div>
                            <input
                                name="name"
                                type="text"
                                value={name}
                                onChange={handleNameChange}
                                placeholder="e.g. Action Figures"
                                required
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:ring-0"
                            />

                            <div className="mt-2 flex items-center gap-2 group min-h-[1.5rem] px-1">
                                <Globe className="h-2.5 w-2.5 text-gray-400" />
                                {!isEditingHandle ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono font-bold text-gray-500">
                                            /categories/<span className="text-black">{handle || "..."}</span>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setIsEditingHandle(true)}
                                            className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-tight flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Edit2 className="h-2.5 w-2.5" />
                                            Edit
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                                        <div className="relative">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] font-bold">/</span>
                                            <input
                                                autoFocus
                                                type="text"
                                                value={handle}
                                                onChange={handleHandleChange}
                                                className="h-6 bg-white border-black rounded px-4 pl-4 text-[10px] font-mono font-bold text-black focus:ring-1 focus:ring-black min-w-[150px]"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault()
                                                        setIsEditingHandle(false)
                                                    }
                                                }}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setIsEditingHandle(false)}
                                            className="px-2 h-6 bg-black text-white text-[9px] font-black rounded uppercase tracking-widest hover:bg-gray-800 transition-colors shadow-sm"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="hidden md:block">
                            {/* Spacer for two column grid */}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                        <textarea
                            name="description"
                            rows={3}
                            defaultValue={category?.description || ""}
                            placeholder="What kind of toys are in this category?"
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:ring-0"
                        />
                    </div>

                    <CatalogImageSection
                        initialImageUrl={category?.image_url}
                        folder="categories"
                    />

                    {/* Products section */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Products
                        </label>
                        <p className="text-xs text-gray-500 mb-3">
                            Select products to add to this category
                        </p>
                        <div className="h-[450px] border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
                            <ProductCheckboxList
                                products={products}
                                selectedProductIds={selectedProductIds}
                            />
                        </div>
                    </div>
                </div>
            </AdminCard>

            <div className="flex gap-2 mt-8 pt-6 border-t">
                <Link href="/admin/categories" className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                    {category ? "Discard" : "Cancel"}
                </Link>
                <SubmitButton loadingText="Saving...">
                    {category ? "Save Changes" : "Save Category"}
                </SubmitButton>
            </div>
        </form>
    )
}
