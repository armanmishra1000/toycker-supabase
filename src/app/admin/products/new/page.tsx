import { createProduct, getAdminCollections } from "@/lib/data/admin"
import CollectionCheckboxList from "@modules/admin/components/collection-checkbox-list"
import Link from "next/link"
import AdminCard from "@modules/admin/components/admin-card"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import { ChevronLeftIcon } from "@heroicons/react/24/outline"

export default async function NewProduct() {
  const collections = await getAdminCollections()

  const actions = (
    <div className="flex gap-2">
      <Link href="/admin/products" className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-black transition-colors uppercase tracking-widest">Cancel</Link>
      <button form="product-form" type="submit" className="px-6 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-all shadow-sm">
        Create Product
      </button>
    </div>
  )

  return (
    <div className="space-y-6">
      <nav className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest">
        <Link href="/admin/products" className="flex items-center hover:text-black transition-colors">
          <ChevronLeftIcon className="h-3 w-3 mr-1" strokeWidth={3} />
          Back to Products
        </Link>
      </nav>

      <AdminPageHeader title="Add Product" actions={actions} />

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
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Image URL</label>
              <input name="image_url" type="url" placeholder="https://cdn.toycker.in/..." className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:ring-0" />
              <p className="mt-3 text-xs text-gray-400 italic">Images help customers visualize the toy during play.</p>
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

          <AdminCard title="Pricing & Taxes">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Price (INR)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">₹</span>
                <input name="price" type="number" step="0.01" placeholder="0.00" required className="w-full rounded-lg border border-gray-300 pl-7 pr-4 py-2.5 text-sm font-black focus:border-black focus:ring-0" />
              </div>
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
        </div>
      </form>
    </div>
  )
}