import { createProduct } from "@/lib/data/admin"
import Link from "next/link"
import AdminCard from "@modules/admin/components/admin-card"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import { ChevronLeftIcon } from "@heroicons/react/24/outline"

export default function NewProduct() {
  const actions = (
    <div className="flex gap-2">
      <Link href="/admin/products" className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900">Cancel</Link>
      <button form="product-form" type="submit" className="px-4 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-all">
        Save Product
      </button>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <nav className="flex items-center gap-2 text-sm font-medium text-gray-500">
        <Link href="/admin/products" className="flex items-center hover:text-gray-900">
          <ChevronLeftIcon className="h-4 w-4 mr-1" />
          Products
        </Link>
      </nav>

      <AdminPageHeader title="Add Product" actions={actions} />

      <form id="product-form" action={createProduct} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <AdminCard title="General Information">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                <input name="name" type="text" placeholder="e.g. Lego Star Wars Set" required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:ring-0" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea name="description" rows={6} placeholder="Detailed product story..." className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:ring-0" />
              </div>
            </div>
          </AdminCard>

          <AdminCard title="Media">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Image URL</label>
              <input name="image_url" type="url" placeholder="https://..." className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:ring-0" />
              <p className="mt-2 text-xs text-gray-400 italic">Pro-tip: Use your R2 or Supabase bucket link here.</p>
            </div>
          </AdminCard>
        </div>

        <div className="space-y-6">
          <AdminCard title="Pricing">
             <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Price (INR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500 text-sm">₹</span>
                  <input name="price" type="number" step="0.01" placeholder="0.00" required className="w-full rounded-lg border border-gray-300 pl-7 pr-4 py-2.5 text-sm focus:border-black focus:ring-0" />
                </div>
              </div>
          </AdminCard>

          <AdminCard title="Inventory">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity</label>
              <input name="stock_count" type="number" placeholder="0" required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:ring-0" />
            </div>
          </AdminCard>

          <AdminCard title="Organization">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">URL Handle</label>
              <input name="handle" type="text" placeholder="lego-star-wars" required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:ring-0" />
            </div>
          </AdminCard>
        </div>
      </form>
    </div>
  )
}