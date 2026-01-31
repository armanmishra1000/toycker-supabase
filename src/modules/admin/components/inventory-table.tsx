"use client"

import { Product } from "@/lib/supabase/types"
import { updateInventory } from "@/lib/data/admin"
import {
  TagIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Loader2,
  PackageIcon,
  LayersIcon,
  AlertCircle
} from "lucide-react"
import { ProtectedAction } from "@/lib/permissions/components/protected-action"
import { PERMISSIONS } from "@/lib/permissions"
import Image from "next/image"
import Link from "next/link"
import { useState, Fragment } from "react"
import { useToast } from "@modules/common/context/toast-context"
import { cn } from "@lib/util/cn"
import { LOW_STOCK_THRESHOLD } from "@/lib/constants/inventory"
import { AdminTableWrapper } from "@modules/admin/components/admin-table-wrapper"

type InventoryTableProps = {
  initialProducts: Product[]
}



export default function InventoryTable({ initialProducts }: InventoryTableProps) {
  const { showToast } = useToast()
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({})
  const [updating, setUpdating] = useState<Record<string, boolean>>({})

  const toggleExpand = (productId: string) => {
    setExpandedProducts(prev => ({ ...prev, [productId]: !prev[productId] }))
  }

  const handleStockChange = async (productId: string, quantity: number, variantId?: string) => {
    const key = variantId || productId
    setUpdating(prev => ({ ...prev, [key]: true }))
    try {
      await updateInventory(productId, quantity, variantId)
      showToast("The stock levels for the selected item have been updated.", "success", "Inventory Updated")
    } catch (error) {
      console.error(error)
      showToast("There was a problem updating the stock levels. Please try again.", "error", "Update Failed")
    } finally {
      setUpdating(prev => ({ ...prev, [key]: false }))
    }
  }

  return (
    <AdminTableWrapper className="bg-white rounded-xl border border-admin-border shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-[#f7f8f9]">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[40px]"></th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[80px]">Image</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Type</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">Available</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {initialProducts.map((product) => {
            const hasVariants = (product.variants?.length || 0) > 1 || (product.options?.length || 0) > 0
            const isExpanded = expandedProducts[product.id]
            const isUpdatingProduct = updating[product.id]

            return (
              <Fragment key={product.id}>
                <tr className={cn("hover:bg-gray-50 transition-colors", isExpanded && "bg-gray-50/50")}>
                  <td className="px-6 py-4">
                    {hasVariants && (
                      <button
                        onClick={() => toggleExpand(product.id)}
                        className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUpIcon className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-10 w-10 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                          unoptimized
                        />
                      ) : (
                        <TagIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/admin/products/${product.id}`} className="block">
                      <p className="text-sm font-semibold text-gray-900 hover:underline">{product.name}</p>
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-mono">
                    {hasVariants ? 'Multiple' : (product.variants?.[0]?.sku || '---')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {hasVariants ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 uppercase">
                          <LayersIcon className="w-3 h-3" />
                          Variants
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 uppercase">
                          <PackageIcon className="w-3 h-3" />
                          Base Stock
                        </span>
                      )}
                      {(hasVariants ? false : (product.stock_count || 0) <= LOW_STOCK_THRESHOLD) && (
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          (product.stock_count || 0) === 0
                            ? "bg-red-50 text-red-700 border border-red-100"
                            : "bg-amber-50 text-amber-700 border border-amber-100"
                        )}>
                          <AlertCircle className="w-3 h-3" />
                          {(product.stock_count || 0) === 0 ? "Out of Stock" : "Low Stock"}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right relative">
                    <div className="flex items-center justify-end gap-2">
                      {isUpdatingProduct && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
                      <ProtectedAction
                        permission={PERMISSIONS.INVENTORY_UPDATE}
                        fallback={<span className="text-sm font-bold text-gray-900 pr-3">{product.stock_count || 0}</span>}
                      >
                        <input
                          type="number"
                          defaultValue={product.stock_count || 0}
                          disabled={hasVariants || isUpdatingProduct}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value)
                            if (!isNaN(val) && val !== product.stock_count) {
                              handleStockChange(product.id, val)
                            }
                          }}
                          className={cn(
                            "w-24 rounded-lg border px-3 py-1.5 text-sm font-medium text-right transition-all focus:ring-2 focus:ring-indigo-500/20",
                            hasVariants ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed" : "border-gray-300 focus:border-indigo-500",
                            !hasVariants && (product.stock_count || 0) === 0 && "border-red-300 text-red-600 bg-red-50/30",
                            !hasVariants && (product.stock_count || 0) > 0 && (product.stock_count || 0) <= LOW_STOCK_THRESHOLD && "border-amber-300 text-amber-600 bg-amber-50/30",
                            !hasVariants && (product.stock_count || 0) > LOW_STOCK_THRESHOLD && "text-gray-900",
                            isUpdatingProduct && "opacity-50"
                          )}
                          title={hasVariants ? "Manage stock at variant level" : "Update base stock"}
                        />
                      </ProtectedAction>
                    </div>
                  </td>
                </tr>
                {hasVariants && isExpanded && (
                  <tr>
                    <td colSpan={6} className="px-0 py-0 overflow-hidden">
                      <div className="bg-[#fcfcfc] border-y border-gray-100 px-6 py-2">
                        <table className="min-w-full">
                          <tbody>
                            {product.variants?.map((variant) => {
                              const isUpdatingVariant = updating[variant.id]
                              return (
                                <tr key={variant.id} className="border-b border-gray-50 last:border-0">
                                  <td className="py-2 pl-12 pr-4 text-sm text-gray-600">
                                    <div className="flex flex-col">
                                      <span className="font-medium text-gray-800">{variant.title}</span>
                                      <span className="text-[10px] text-gray-400 font-mono uppercase tracking-tighter">SKU: {variant.sku || '---'}</span>
                                    </div>
                                  </td>
                                  <td className="py-2 px-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      {(variant.inventory_quantity || 0) <= LOW_STOCK_THRESHOLD && (
                                        <span className={cn(
                                          "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                                          (variant.inventory_quantity || 0) === 0
                                            ? "bg-red-50 text-red-700 border border-red-100"
                                            : "bg-amber-50 text-amber-700 border border-amber-100"
                                        )}>
                                          <AlertCircle className="w-2.5 h-2.5" />
                                          {(variant.inventory_quantity || 0) === 0 ? "Empty" : "Low"}
                                        </span>
                                      )}
                                      <span className="text-xs text-gray-400 italic">
                                        {variant.manage_inventory ? "Tracked" : "Not tracked"}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-2 pl-4 pr-0 text-right w-[150px]">
                                    <div className="flex items-center justify-end gap-2">
                                      {isUpdatingVariant && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
                                      <ProtectedAction
                                        permission={PERMISSIONS.INVENTORY_UPDATE}
                                        fallback={<span className="text-xs font-bold text-gray-800 pr-2">{variant.inventory_quantity || 0}</span>}
                                      >
                                        <input
                                          type="number"
                                          defaultValue={variant.inventory_quantity || 0}
                                          disabled={isUpdatingVariant}
                                          onBlur={(e) => {
                                            const val = parseInt(e.target.value)
                                            if (!isNaN(val) && val !== variant.inventory_quantity) {
                                              handleStockChange(product.id, val, variant.id)
                                            }
                                          }}
                                          className={cn(
                                            "w-24 rounded-md border bg-white px-2 py-1 text-xs font-semibold text-right transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20",
                                            (variant.inventory_quantity || 0) === 0 ? "border-red-300 text-red-600 bg-red-50/30" :
                                              (variant.inventory_quantity || 0) <= LOW_STOCK_THRESHOLD ? "border-amber-300 text-amber-600 bg-amber-50/30" :
                                                "border-gray-200 text-gray-800",
                                            isUpdatingVariant && "opacity-50"
                                          )}
                                        />
                                      </ProtectedAction>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </AdminTableWrapper>
  )
}
