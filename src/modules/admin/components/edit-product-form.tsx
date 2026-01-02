"use client"

import { Product, ProductVariant, Category, Collection } from "@/lib/supabase/types"
import { updateProduct } from "@/lib/data/admin"
import AdminCard from "./admin-card"
import { SubmitButton } from "./submit-button"
import ImageUpload from "./image-upload"
import RichTextEditor from "./rich-text-editor"
import CategoryCheckboxList from "./category-checkbox-list"
import CollectionCheckboxList from "./collection-checkbox-list"
import AdminBadge from "./admin-badge"
import ProductVariantEditor from "./product-variant-editor"
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline"
import { PackageIcon, LayersIcon } from "lucide-react"
import { cn } from "@/lib/util/cn"
import { useState } from "react"

type EditProductFormProps = {
  product: Product
  variants: ProductVariant[]
  categories: Category[]
  collections: Collection[]
  selectedCategoryIds: string[]
  selectedCollectionIds: string[]
}

export default function EditProductForm({
  product,
  variants,
  categories,
  collections,
  selectedCategoryIds,
  selectedCollectionIds
}: EditProductFormProps) {
  const [productType, setProductType] = useState<"single" | "variant">(
    variants.length > 0 ? "variant" : "single"
  )

  return (
    <form action={updateProduct}>
      <input type="hidden" name="id" value={product.id} />
      <input type="hidden" name="product_type" value={productType} />

      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">{product.name}</h1>
            <AdminBadge variant={product.status === 'active' ? 'success' : 'warning'}>{product.status}</AdminBadge>
          </div>
          <div className="flex gap-2 shrink-0">
            <a
              href={`/products/${product.handle}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-sm font-bold rounded-lg hover:bg-white hover:border-gray-400 transition-all"
            >
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              View in store
            </a>
            <SubmitButton className="inline-flex items-center px-5 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-all shadow-sm">
              Save Product
            </SubmitButton>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <AdminCard title="Product Details">
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Product Title</label>
                  <input name="name" type="text" defaultValue={product.name} required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium focus:border-black focus:ring-0 transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Description</label>
                  <RichTextEditor name="description" defaultValue={product.description || ""} placeholder="Tell the product's story..." />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Short Description</label>
                  <textarea name="short_description" rows={3} defaultValue={product.short_description || ""} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium focus:border-black focus:ring-0 transition-all" placeholder="Brief summary (displayed on product page)..." />
                </div>
              </div>
            </AdminCard>

            <AdminCard title="Media Assets">
              <div className="space-y-4">
                <ImageUpload name="image_url" initialUrl={product.image_url || undefined} label="Primary Image" />
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">YouTube Video URL</label>
                  <input name="video_url" type="url" defaultValue={product.video_url || ""} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium focus:border-black focus:ring-0 transition-all" placeholder="https://youtube.com/watch?v=..." />
                </div>

                {/* Image Gallery - Show all images */}
                {(product.images && Array.isArray(product.images) && product.images.length > 0) ? (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                      Media Gallery ({product.images.length} images)
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                      {product.images.map((img, index) => {
                        const imageUrl = typeof img === 'string' ? img : img.url
                        return (
                          <div
                            key={index}
                            className={`aspect-square relative rounded-lg overflow-hidden border ${index === 0 ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'} bg-gray-50 group`}
                          >
                            <img
                              src={imageUrl}
                              alt={`Product image ${index + 1}`}
                              className="object-cover w-full h-full transition-transform group-hover:scale-105"
                            />
                            {index === 0 && (
                              <span className="absolute top-1 left-1 bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                Primary
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : null}
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
                  onClick={() => setProductType("variant")}
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
              <ProductVariantEditor productId={product.id} initialVariants={variants} />
            )}
          </div>

          <div className="space-y-6">
            <AdminCard title="Status & Visibility">
              <div className="space-y-4">
                <p className="text-xs text-gray-500 font-medium leading-relaxed">This product is currently <span className="font-bold text-black uppercase">{product.status}</span> on your storefront.</p>
                <select name="status" defaultValue={product.status || "active"} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-bold focus:border-black focus:ring-0 bg-white">
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
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
                          <input name="price" type="number" step="0.01" defaultValue={product.price} required className="w-full rounded-lg border border-gray-300 pl-7 pr-4 py-2.5 text-sm font-black focus:border-black focus:ring-0" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Compare at</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">₹</span>
                          <input name="compare_at_price" type="number" step="0.01" defaultValue={product.metadata?.compare_at_price as number || ""} className="w-full rounded-lg border border-gray-300 pl-7 pr-4 py-2.5 text-sm font-medium focus:border-black focus:ring-0" />
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium italic">To show a reduced price, move the original price into &quot;Compare at price&quot;.</p>
                  </div>
                </AdminCard>

                <AdminCard title="Inventory">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                        Base Stock
                      </label>
                      <input name="stock_count" type="number" defaultValue={product.stock_count} required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-bold focus:border-black focus:ring-0" />
                    </div>
                  </div>
                </AdminCard>
              </>
            )}

            <AdminCard title="Organization">
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Categories</label>
                  <CategoryCheckboxList
                    categories={categories}
                    selectedIds={selectedCategoryIds}
                    name="category_ids"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Collections</label>
                  <CollectionCheckboxList
                    collections={collections}
                    selectedIds={selectedCollectionIds}
                    name="collection_ids"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">URL Handle</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400 text-xs font-medium">/</span>
                    <input name="handle" type="text" defaultValue={product.handle} required className="w-full rounded-lg border border-gray-300 pl-6 pr-4 py-2.5 text-xs font-bold text-gray-600 focus:border-black focus:ring-0 bg-gray-50/50" />
                  </div>
                </div>
              </div>
            </AdminCard>
          </div>
        </div>
      </div>
    </form>
  )
}
