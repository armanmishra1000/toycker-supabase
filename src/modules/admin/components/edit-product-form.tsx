"use client"

import { Product, ProductVariant, Category, Collection } from "@/lib/supabase/types"
import { updateProduct } from "@/lib/data/admin"
import AdminCard from "./admin-card"
import { SubmitButton } from "./submit-button"
import RichTextEditor from "./rich-text-editor"
import CategoryCheckboxList from "./category-checkbox-list"
import CollectionCheckboxList from "./collection-checkbox-list"
import AdminBadge from "./admin-badge"
import ProductVariantEditor from "./product-variant-editor"
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline"
import { PackageIcon, LayersIcon } from "lucide-react"
import MediaGallery from "./media-manager"
import MultipleProductSelector from "./multiple-product-selector"
import { ProtectedAction } from "@/lib/permissions/components/protected-action"
import { PERMISSIONS } from "@/lib/permissions"
import { cn } from "@/lib/util/cn"
import { useState, useMemo } from "react"
import { getYoutubeId, getYoutubeEmbedUrl } from "@/lib/util/youtube"
import { Tag, Globe, Layers, Edit2 } from "lucide-react"

type EditProductFormProps = {
  product: Product
  variants: ProductVariant[]
  categories: Category[]
  collections: Collection[]
  selectedCategoryIds: string[]
  selectedCollectionIds: string[]
  selectedRelatedProductIds: string[]
}

export default function EditProductForm({
  product,
  variants,
  categories,
  collections,
  selectedCategoryIds,
  selectedCollectionIds,
  selectedRelatedProductIds
}: EditProductFormProps) {
  const [relatedIds, setRelatedIds] = useState<string[]>(selectedRelatedProductIds)
  const [productType, setProductType] = useState<"single" | "variant">(
    variants.length > 0 ? "variant" : "single"
  )
  const [videoUrl, setVideoUrl] = useState(product.video_url || "")
  const videoId = getYoutubeId(videoUrl)
  const embedUrl = getYoutubeEmbedUrl(videoId)
  const [handle, setHandle] = useState(product.handle)
  const [isEditingHandle, setIsEditingHandle] = useState(false)

  const initialRelatedProducts = useMemo(() => product.related_combinations?.map(rc => ({
    id: rc.related_product.id,
    title: rc.related_product.name,
    handle: rc.related_product.handle,
    thumbnail: rc.related_product.image_url
  })) || [], [product.related_combinations])

  return (
    <form action={updateProduct}>
      <input type="hidden" name="id" value={product.id} />
      <input type="hidden" name="product_type" value={productType} />

      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">{product.name}</h1>
              <AdminBadge variant={product.status === 'active' ? 'success' : 'warning'}>{product.status}</AdminBadge>
            </div>
            <div className="flex flex-col gap-2">
              <input type="hidden" name="handle" value={handle} />

              <div className="flex items-center gap-2 group min-h-[1.75rem]">
                <Globe className="h-3 w-3 text-gray-400" />

                {!isEditingHandle ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-gray-500">
                      /products/<span className="text-black">{handle}</span>
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
                        onChange={(e) => setHandle(e.target.value)}
                        className="h-6 bg-white border-black rounded px-4 pl-4 text-[10px] font-mono font-bold text-black focus:ring-1 focus:ring-black min-w-[180px]"
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
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Short Description</label>
                <textarea name="short_description" rows={3} defaultValue={product.short_description || ""} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium focus:border-black focus:ring-0 transition-all" placeholder="Brief summary (displayed on product page)..." />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Description</label>
                <RichTextEditor name="description" defaultValue={product.description || ""} placeholder="Tell the product's story..." />
              </div>
            </div>
          </AdminCard>

          <AdminCard title="Media Assets">
            <div className="space-y-4">
              <MediaGallery
                initialImages={product.images?.map(img => typeof img === 'string' ? img : img.url) || []}
                onOrderChange={(_newImages: string[]) => {
                  // This is handled by hidden input for form submission
                }}
              />
            </div>
          </AdminCard>

          <AdminCard title="YouTube Video">
            <div className="space-y-4">
              <p className="text-xs text-gray-500 mb-2">
                Enhance your product page with a video. We support direct YouTube links.
              </p>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 text-xs">Video URL</label>
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
            <ProductVariantEditor
              productId={product.id}
              initialVariants={variants}
              productImages={product.images?.map(img => typeof img === 'string' ? img : img.url) || []}
            />
          )}

          <AdminCard title="Search Engine Optimization (SEO)">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Meta Title</label>
                    <input
                      name="seo_title"
                      type="text"
                      defaultValue={product.seo_title || ""}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium focus:border-black focus:ring-0 transition-all"
                      placeholder={product.name}
                    />
                    <p className="mt-1.5 text-[10px] text-gray-400 font-medium italic">Recommended: 50-60 characters. Leave empty to use product name.</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Meta Description</label>
                    <textarea
                      name="seo_description"
                      rows={4}
                      defaultValue={product.seo_description || ""}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium focus:border-black focus:ring-0 transition-all"
                      placeholder={product.short_description || "Brief SEO summary..."}
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
                      defaultValue={(product.seo_metadata?.keywords as string) || ""}
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
                        defaultChecked={product.seo_metadata?.no_index === true}
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
                      defaultValue={(product.seo_metadata?.og_title as string) || ""}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium focus:border-black focus:ring-0 transition-all"
                      placeholder="Title for social media sharing"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">OG Description</label>
                    <input
                      name="og_description"
                      type="text"
                      defaultValue={(product.seo_metadata?.og_description as string) || ""}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium focus:border-black focus:ring-0 transition-all"
                      placeholder="Description for social media sharing"
                    />
                  </div>
                </div>
              </div>
            </div>
          </AdminCard>
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
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50">
                  <Tag className="w-4 h-4 text-black" />
                  <label className="block text-xs font-black text-black uppercase tracking-widest">Categories</label>
                </div>
                <CategoryCheckboxList
                  categories={categories}
                  selectedIds={selectedCategoryIds}
                  name="category_ids"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-0">
                  <Layers className="w-4 h-4 text-black" />
                  <label className="block text-xs font-black text-black uppercase tracking-widest">Collections</label>
                </div>
                <CollectionCheckboxList
                  collections={collections}
                  selectedIds={selectedCollectionIds}
                  name="collection_ids"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-0">
                  <Layers className="w-4 h-4 text-black" />
                  <label className="block text-xs font-black text-black uppercase tracking-widest">Frequently Bought Together</label>
                </div>
                <MultipleProductSelector
                  selectedIds={relatedIds}
                  initialProducts={initialRelatedProducts}
                  onChange={setRelatedIds}
                  name="related_product_ids"
                />
              </div>
            </div>
          </AdminCard>
        </div>
      </div>

      {/* Submit buttons restored to the bottom of the form */}
      <div className="flex justify-end gap-2 mt-6">
        <a
          href={`/products/${product.handle}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-sm font-bold rounded-lg hover:bg-white hover:border-gray-400 transition-all"
        >
          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          View in store
        </a>
        <ProtectedAction permission={PERMISSIONS.PRODUCTS_UPDATE} hideWhenDisabled>
          <SubmitButton className="inline-flex items-center px-5 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-all shadow-sm">
            Save Product
          </SubmitButton>
        </ProtectedAction>
      </div>
    </form>
  )
}
