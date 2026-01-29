"use client"

import { ProductVariant, VariantFormData } from "@/lib/supabase/types"
import { createProduct } from "@/lib/data/admin"
import AdminCard from "./admin-card"
import { SubmitButton } from "./submit-button"
import RichTextEditor from "./rich-text-editor"
import CollectionCheckboxList from "./collection-checkbox-list"
import { TrashIcon, PlusIcon, Layers, Package, Tag, Globe, Edit2, Sparkles, ChevronDown } from "lucide-react"
import { useState } from "react"
import { cn } from "@lib/util/cn"
import { getYoutubeId, getYoutubeEmbedUrl } from "@/lib/util/youtube"
import { PhotoIcon } from "@heroicons/react/24/outline"
import { COLOR_SWATCH_MAP, STANDARD_COLORS } from "@/lib/constants/colors"
import CategoryCheckboxList from "./category-checkbox-list"
import MediaGallery from "./media-manager"

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
  const [isEditingHandle, setIsEditingHandle] = useState(false)
  const [videoUrl, setVideoUrl] = useState("")
  const videoId = getYoutubeId(videoUrl)
  const embedUrl = getYoutubeEmbedUrl(videoId)

  const [options, setOptions] = useState<{ title: string; values: string[] }[]>([
    { title: "Color", values: [] }
  ])
  const [openPickerIndex, setOpenPickerIndex] = useState<number | null>(null)

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

  const handleUpdateOption = (idx: number, field: string, value: any) => {
    const nextOptions = [...options]
    let processedValue = value

    // Auto-capitalize values if it's the values field
    if (field === "values" && Array.isArray(value)) {
      processedValue = value.map(v =>
        typeof v === "string" ? v.toUpperCase() : v
      )
    }

    // @ts-ignore
    nextOptions[idx] = { ...nextOptions[idx], [field]: processedValue }
    setOptions(nextOptions)
  }

  const handleRemoveOption = (idx: number) => {
    if (options.length <= 1) return // Keep at least one option
    const nextOptions = options.filter((_, i) => i !== idx)
    setOptions(nextOptions)
  }

  const handleGenerate = () => {
    const validOptions = options.filter(o => o.title && o.values.length > 0)
    if (validOptions.length === 0) return

    const cartesian = (...a: any[]) => a.reduce((a, b) => a.flatMap((d: any) => b.map((e: any) => [d, e].flat())))
    const combinations = validOptions.length === 1
      ? validOptions[0].values.map(v => [v])
      : cartesian(...validOptions.map(o => o.values))

    const newVariants: VariantFormData[] = combinations.map((combo: string[]) => {
      const title = combo.join(" / ")
      return {
        title,
        sku: "",
        price: 0,
        compare_at_price: null,
        inventory_quantity: 0,
      }
    })

    setVariants([...newVariants])
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
              <div className="space-y-2">
                <input
                  name="name"
                  type="text"
                  placeholder="e.g. 1:16 Racing Sport Mood Car"
                  required
                  value={name}
                  onChange={handleNameChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:ring-0"
                />
                <input type="hidden" name="handle" value={handle} />

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 group min-h-[1.5rem] px-1">
                    <Globe className="h-2.5 w-2.5 text-gray-400" />

                    {!isEditingHandle ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-gray-500">
                          /products/<span className="text-black">{handle || "..."}</span>
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

                  {!isEditingHandle && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-gray-200 rounded-lg bg-gray-50/50 w-fit">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Live Preview:</span>
                      <span className="text-[10px] font-mono text-gray-500 truncate">
                        /products/<span className="text-black font-bold">{handle || "..."}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
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
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Description</label>
              <RichTextEditor name="description" placeholder="Tell the product's story..." />
            </div>
          </div>
        </AdminCard>

        <AdminCard title="Media Assets">
          <div className="space-y-4">
            <MediaGallery />
          </div>
        </AdminCard>

        <AdminCard title="YouTube Video">
          <div className="space-y-4">
            <p className="text-xs text-gray-500 mb-2">
              Enhance your product page with a video. We support direct YouTube links.
            </p>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Video URL</label>
              <input
                name="video_url"
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium focus:border-black focus:ring-0 transition-all bg-gray-50/30"
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
            {embedUrl && (
              <div className="mt-4 aspect-video rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                <iframe
                  className="w-full h-full"
                  src={embedUrl}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
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
              <Package className={cn("w-6 h-6", productType === "single" ? "text-black" : "text-gray-300")} />
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
              <Layers className={cn("w-6 h-6", productType === "variant" ? "text-black" : "text-gray-300")} />
              <div>
                <p className="text-sm font-bold uppercase tracking-tight">Variant-based</p>
                <p className="text-[10px] opacity-70">Multiple sizes, colors, or prices</p>
              </div>
            </button>
          </div>
        </AdminCard>

        {productType === "variant" && (
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
                    className="text-[10px] font-bold text-blue-600 hover:underline px-1"
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
                              <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-2 min-w-[200px]">
                                <div className="p-2 border-b border-gray-50 mb-1 flex justify-between items-center">
                                  <p className="text-[9px] font-black text-gray-400 uppercase">Expanded Color Library</p>
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
                  onClick={() => {
                    const price = prompt("Enter selling price for all variants:")
                    if (price === null) return
                    const p = parseFloat(price)
                    if (isNaN(p)) return
                    setVariants(variants.map(v => ({ ...v, price: p })))
                  }}
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
                      <tr key={index} className="bg-white hover:bg-gray-50/50 transition-colors">
                        <td className="p-3">
                          {/* Media Picker logic - we'll use a placeholder or same picker if images are available */}
                          <div className="w-10 h-10 border border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-300">
                            <PhotoIcon className="w-5 h-5" />
                          </div>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className="w-full bg-transparent border-none rounded-md text-sm font-semibold focus:ring-0 placeholder:text-gray-300"
                            placeholder="e.g. Red / Large"
                            value={variant.title}
                            onChange={(e) => handleVariantChange(index, "title", e.target.value)}
                            required
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className="w-full bg-transparent border-none rounded-md text-[10px] font-mono focus:ring-0 placeholder:text-gray-300 uppercase"
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
                          <div className="flex items-center justify-end">
                            <span className="text-gray-400 mr-1 font-medium">₹</span>
                            <input
                              type="number"
                              className="w-16 bg-transparent border-none rounded-md text-sm font-medium text-gray-500 text-right focus:ring-0"
                              placeholder="0"
                              value={variant.compare_at_price || ""}
                              onChange={(e) => handleVariantChange(index, "compare_at_price", e.target.value === "" ? null : parseFloat(e.target.value))}
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
              <button
                type="button"
                onClick={handleAddVariant}
                className="inline-flex items-center text-xs font-black text-gray-400 hover:text-black transition-colors uppercase tracking-widest gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Add another variant
              </button>
            </div>
          </AdminCard>
        )
        }

        <AdminCard title="Search Engine Optimization (SEO)">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Meta Title</label>
                  <input
                    name="seo_title"
                    type="text"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium focus:border-black focus:ring-0 transition-all"
                    placeholder="SEO title (leave empty for product name)"
                  />
                  <p className="mt-1.5 text-[10px] text-gray-400 font-medium italic">Recommended: 50-60 characters.</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Meta Description</label>
                  <textarea
                    name="seo_description"
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium focus:border-black focus:ring-0 transition-all"
                    placeholder="Brief SEO summary..."
                  />
                  <p className="mt-1.5 text-[10px] text-gray-400 font-medium italic">Recommended: 150-160 characters.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Focus Keywords</label>
                  <input
                    name="seo_keywords"
                    type="text"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium focus:border-black focus:ring-0 transition-all"
                    placeholder="toy, racing car, fun, gift"
                  />
                  <p className="mt-1.5 text-[10px] text-gray-400 font-medium italic">Separate keywords with commas.</p>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Search Visibility</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="no_index"
                      name="no_index"
                      value="true"
                      className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                    />
                    <label htmlFor="no_index" className="text-xs font-bold text-gray-600">
                      Hide this product from search engines (noindex)
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">OpenGraph (Social Media Share)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">OG Title</label>
                  <input
                    name="og_title"
                    type="text"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium focus:border-black focus:ring-0 transition-all"
                    placeholder="Title for social media sharing"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">OG Description</label>
                  <input
                    name="og_description"
                    type="text"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium focus:border-black focus:ring-0 transition-all"
                    placeholder="Description for social media sharing"
                  />
                </div>
              </div>
            </div>
          </div>
        </AdminCard>
      </div >

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
              <Layers className="w-3 h-3" />
              Managed via Variants
            </h4>
            <p className="text-[10px] text-yellow-700 font-medium leading-relaxed">
              Base price and total stock will be automatically calculated from your variant list.
            </p>
          </div>
        )}

        <AdminCard title="Organization">
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50">
                <Tag className="w-4 h-4 text-black" />
                <label className="block text-xs font-black text-black uppercase tracking-widest">Categories</label>
              </div>
              <CategoryCheckboxList
                categories={categories}
                selectedIds={[]}
                name="category_ids"
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50">
                <Layers className="w-4 h-4 text-black" />
                <label className="block text-xs font-black text-black uppercase tracking-widest">Collections</label>
              </div>
              <CollectionCheckboxList
                collections={collections}
                selectedIds={[]}
                name="collection_ids"
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
    </form >
  )
}
