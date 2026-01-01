import { createProduct, getAdminCollections, getAdminCategories } from "@/lib/data/admin"
import CollectionCheckboxList from "@modules/admin/components/collection-checkbox-list"
import { SubmitButton } from "@modules/admin/components/submit-button"
import ImageUpload from "@modules/admin/components/image-upload"
import Link from "next/link"
import AdminCard from "@modules/admin/components/admin-card"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import { ChevronLeftIcon } from "@heroicons/react/24/outline"

export default async function NewProduct() {
  const [collectionsData, categoriesData] = await Promise.all([
    getAdminCollections(),
    getAdminCategories()
  ])

  const collections = collectionsData.collections
  const categories = categoriesData.categories

  return (
    <div className="space-y-6">
      <nav className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest">
        <Link href="/admin/products" className="flex items-center hover:text-black transition-colors">
          <ChevronLeftIcon className="h-3 w-3 mr-1" strokeWidth={3} />
          Back to Products
        </Link>
      </nav>

      <AdminPageHeader title="Add Product" />

      <form id="product-form" action={createProduct} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <AdminCard title="General Information">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Product Title</label>
                <input name="name" type="text" placeholder="e.g. 1:16 Racing Sport Mood Car" required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:ring-0" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Description</label>
                <textarea name="description" rows={8} placeholder="Tell the product's story..." className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:ring-0" />
              </div>
            </div>
          </AdminCard>

          <AdminCard title="Media Library">
            <ImageUpload name="image_url" />
          </AdminCard>

          <AdminCard title="Product Variants">
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 mb-2">Product variants can be added after creating the product.</p>
              <p className="text-xs text-gray-400">Once created, you can add variants like different sizes, colors, or styles.</p>
            </div>
          </AdminCard>
        </div>

        <div className="space-y-6">
          <AdminCard title="Visibility">
            <div className="space-y-4">
              <select name="status" defaultValue="active" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-bold focus:border-black focus:ring-0 bg-white">
                <option value="active">Active (Visible)</option>
                <option value="draft">Draft (Hidden)</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </AdminCard>

          <AdminCard title="Pricing">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">₹</span>
                    <input name="price" type="number" step="0.01" placeholder="0.00" required className="w-full rounded-lg border border-gray-300 pl-7 pr-4 py-2.5 text-sm font-black focus:border-black focus:ring-0" />
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
              <p className="text-[10px] text-gray-400 font-medium italic">To show a reduced price, move the original price into &quot;Compare at price&quot;.</p>
            </div>
          </AdminCard>

          <AdminCard title="Inventory Control">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Opening Stock</label>
              <input name="stock_count" type="number" placeholder="0" required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-bold focus:border-black focus:ring-0" />
            </div>
          </AdminCard>

          <AdminCard title="Organization">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Category</label>
                <select
                  name="category_id"
                  defaultValue=""
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-bold focus:border-black focus:ring-0 bg-white"
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
                <input name="handle" type="text" placeholder="toy-slug-here" required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-bold focus:border-black focus:ring-0" />
              </div>
            </div>
          </AdminCard>

          <div className="flex justify-end">
            <Link href="/admin/products" className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-black transition-colors uppercase tracking-widest">
              Cancel
            </Link>
            <SubmitButton className="px-6 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-all shadow-sm ml-2">
              Create Product
            </SubmitButton>
          </div>
        </div>
      </form>
    </div>
  )
}