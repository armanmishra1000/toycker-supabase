"use client"

import { ProductVariant, VariantFormData } from "@/lib/supabase/types"
import { createProduct } from "@/lib/data/admin"
import AdminCard from "./admin-card"
import { SubmitButton } from "./submit-button"
import ImageUpload from "./image-upload"
import RichTextEditor from "./rich-text-editor"
import CollectionCheckboxList from "./collection-checkbox-list"
import { TrashIcon, PlusIcon, LayersIcon, PackageIcon } from "lucide-react"
import { useState } from "react"
import { cn } from "@lib/util/cn"

type NewProductFormProps = {
  collections: any[]
  categories: any[]
}

export default function NewProductForm({ collections, categories }: NewProductFormProps) {
  const [productType, setProductType] = useState<"single" | "variant">("single")
  const [variants, setVariants] = useState<VariantFormData[]>([])
  const [name, setName] = useState("")
  const [handle, setHandle] = useState("")
  const [isHandleManuallyEdited, setIsHandleManuallyEdited] = useState(false)

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
  }

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

  const handleRemoveVariant = (index: number) => {
    const newVariants = [...variants]
    newVariants.splice(index, 1)
    setVariants(newVariants)
  }

  const handleVariantChange = (index: number, field: keyof VariantFormData, value: any) => {
    const newVariants = [...variants]
    newVariants[index] = { ...newVariants[index], [field]: value }
    setVariants(newVariants)
  }

  return (
    <form id="product-form" action={createProduct} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Hidden input for variants JSON */}
      <input type="hidden" name="variants" value={JSON.stringify(productType === "variant" ? variants : [])} />

      <div className="lg:col-span-2 space-y-6">
        <AdminCard title="General Information">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Product Title</label>
              <input 
                name="name" 
                type="text" 
                placeholder="e.g. 1:16 Racing Sport Mood Car" 
                required 
                value={name}
                onChange={handleNameChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:ring-0" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Description</label>
              <RichTextEditor name="description" placeholder="Tell the product's story..." />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Short Description</label>
              <textarea 
                name="short_description" 
                rows={3} 
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium focus:border-black focus:ring-0 transition-all" 
                placeholder="Brief summary (displayed on product page)..." 
              />
            </div>
          </div>
        </AdminCard>

        <AdminCard title="Media Library">
          <ImageUpload name="image_url" />
          <div className="mt-4">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">YouTube Video URL</label>
            <input 
              name="video_url" 
              type="url" 
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium focus:border-black focus:ring-0 transition-all" 
              placeholder="https://youtube.com/watch?v=..." 
            />
          </div>
        </AdminCard>

        <AdminCard title="Product Type">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setProductType("single")}
              className={cn(
                "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all text-center",
                productType === "single"
                  ? "border-black bg-gray-50 text-black shadow-sm"
                  : "border-gray-100 hover:border-gray-200 text-gray-400"
              )}
            >
              <PackageIcon className={cn("w-6 h-6", productType === "single" ? "text-black" : "text-gray-300")} />
              <div>
                <p className="text-sm font-bold uppercase tracking-tight">Single Product</p>
                <p className="text-[10px] opacity-70">One price, fixed inventory</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setProductType("variant")
                if (variants.length === 0) handleAddVariant()
              }}
              className={cn(
                "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all text-center",
                productType === "variant"
                  ? "border-black bg-gray-50 text-black shadow-sm"
                  : "border-gray-100 hover:border-gray-200 text-gray-400"
              )}
            >
              <LayersIcon className={cn("w-6 h-6", productType === "variant" ? "text-black" : "text-gray-300")} />
              <div>
                <p className="text-sm font-bold uppercase tracking-tight">Variant-based</p>
                <p className="text-[10px] opacity-70">Multiple sizes, colors, or prices</p>
              </div>
            </button>
          </div>
        </AdminCard>

        {productType === "variant" && (
          <AdminCard title={`Product Variants (${variants.length})`}>
            <div className="space-y-4">
              <div className="overflow-x-auto border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#f7f8f9] text-gray-500 font-bold text-[10px] uppercase tracking-widest border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 min-w-[150px]">Title / Option</th>
                      <th className="px-4 py-3 w-[120px]">SKU</th>
                      <th className="px-4 py-3 w-[110px] text-right">Price</th>
                      <th className="px-4 py-3 w-[80px] text-right">Stock</th>
                      <th className="px-4 py-3 w-[40px]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {variants.map((variant, index) => (
                      <tr key={index} className="bg-white hover:bg-gray-50 transition-colors">
                        <td className="p-2">
                          <input
                            type="text"
                            className="w-full bg-transparent border-none rounded-md text-sm font-medium focus:ring-0 placeholder:text-gray-300"
                            placeholder="e.g. Red / Large"
                            value={variant.title}
                            onChange={(e) => handleVariantChange(index, "title", e.target.value)}
                            required
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className="w-full bg-transparent border-none rounded-md text-[10px] font-mono focus:ring-0 placeholder:text-gray-300"
                            placeholder="SKU-123"
                            value={variant.sku}
                            onChange={(e) => handleVariantChange(index, "sku", e.target.value)}
                          />
                        </td>
                        <td className="p-2">
                          <div className="flex items-center justify-end">
                            <span className="text-gray-400 mr-1 font-bold">₹</span>
                            <input
                              type="number"
                              className="w-16 bg-transparent border-none rounded-md text-sm font-black text-right focus:ring-0"
                              placeholder="0"
                              value={variant.price || ""}
                              onChange={(e) => handleVariantChange(index, "price", e.target.value === "" ? 0 : parseFloat(e.target.value))}
                              required
                            />
                          </div>
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            className="w-full bg-transparent border-none rounded-md text-sm font-bold text-right focus:ring-0"
                            placeholder="0"
                            value={variant.inventory_quantity || ""}
                            onChange={(e) => handleVariantChange(index, "inventory_quantity", e.target.value === "" ? 0 : parseInt(e.target.value))}
                            required
                          />
                        </td>
                        <td className="p-2 text-center text-gray-300">
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(index)}
                            className="hover:text-red-500 transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                onClick={handleAddVariant}
                className="inline-flex items-center text-xs font-bold text-gray-400 hover:text-black transition-colors uppercase tracking-widest gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Add another variant
              </button>
            </div>
          </AdminCard>
        )}
      </div>

      <div className="space-y-6">
        <AdminCard title="Visibility">
          <div className="space-y-4">
            <select name="status" defaultValue="active" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-bold focus:border-black focus:ring-0 bg-white cursor-pointer">
              <option value="active">Active (Visible)</option>
              <option value="draft">Draft (Hidden)</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </AdminCard>

        {productType === "single" && (
          <>
            <AdminCard title="Pricing">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">₹</span>
                      <input name="price" type="number" step="0.01" placeholder="0.00" required={productType === "single"} className="w-full rounded-lg border border-gray-300 pl-7 pr-4 py-2.5 text-sm font-black focus:border-black focus:ring-0" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Compare at</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">₹</span>
                      <input name="compare_at_price" type="number" step="0.01" placeholder="0.00" className="w-full rounded-lg border border-gray-300 pl-7 pr-4 py-2.5 text-sm font-medium focus:border-black focus:ring-0" />
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 font-medium italic leading-tight">To show a reduced price, move the original price into &quot;Compare at price&quot;.</p>
              </div>
            </AdminCard>

            <AdminCard title="Inventory Control">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Opening Stock</label>
                <input name="stock_count" type="number" placeholder="0" required={productType === "single"} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-bold focus:border-black focus:ring-0" />
              </div>
            </AdminCard>
          </>
        )}

        {productType === "variant" && (
          <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
            <h4 className="text-[10px] font-black text-yellow-800 uppercase tracking-widest mb-1 flex items-center gap-2">
              <LayersIcon className="w-3 h-3" />
              Managed via Variants
            </h4>
            <p className="text-[10px] text-yellow-700 font-medium leading-relaxed">
              Base price and total stock will be automatically calculated from your variant list.
            </p>
          </div>
        )}

        <AdminCard title="Organization">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Category</label>
              <select
                name="category_id"
                defaultValue=""
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-bold focus:border-black focus:ring-0 bg-white cursor-pointer"
              >
                <option value="">No category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Collections</label>
              <CollectionCheckboxList
                collections={collections}
                selectedIds={[]}
                name="collection_ids"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">URL Handle</label>
              <input 
                name="handle" 
                type="text" 
                placeholder="toy-slug-here" 
                required 
                value={handle}
                onChange={handleHandleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-bold focus:border-black focus:ring-0" 
              />
            </div>
          </div>
        </AdminCard>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-black transition-colors uppercase tracking-widest"
            onClick={() => window.history.back()}
          >
            Cancel
          </button>
          <SubmitButton className="px-8 py-3 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all shadow-xl shadow-black/5 active:scale-95">
            Create Product
          </SubmitButton>
        </div>
      </div>
    </form>
  )
}
