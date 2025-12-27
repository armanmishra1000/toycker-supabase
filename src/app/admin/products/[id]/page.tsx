import { updateProduct } from "@/lib/data/admin"
import Link from "next/link"
import { retrieveProduct } from "@lib/data/products"
import { notFound } from "next/navigation"
import AdminCard from "@modules/admin/components/admin-card"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import { ChevronLeftIcon } from "@heroicons/react/24/outline"

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await retrieveProduct(id)

  if (!product) notFound()

  const actions = (
    <div className="flex gap-2">
      <Link href="/admin/products" className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900">Discard</Link>
      <button form="product-form" type="submit" className="px-4 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-all">
        Save Changes
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

      <AdminPageHeader title={product.name} actions={actions} />

      <form id="product-form" action={updateProduct} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <input type="hidden" name="id" value={product.id} />
        
        <div className="lg:col-span-2 space-y-6">
          <AdminCard title="General Information">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                <input name="name" type="text" defaultValue={product.name} required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:ring-0" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea name="description" rows={6} defaultValue={product.description || ""} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:ring-0" />
              </div>
            </div>
          </AdminCard>

          <AdminCard title="Media">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Primary Image URL</label>
                <input name="image_url" type="url" defaultValue={product.image_url || ""} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:ring-0" />
              </div>
              {product.image_url && (
                <div className="aspect-square w-32 relative rounded-lg overflow-hidden border border-gray-200">
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                   <img src={product.image_url} alt="Preview" className="object-cover w-full h-full" />
                </div>
              )}
            </div>
          </AdminCard>
        </div>

        <div className="space-y-6">
          <AdminCard title="Pricing">
             <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Price (INR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500 text-sm">₹</span>
                  <input name="price" type="number" step="0.01" defaultValue={product.price} required className="w-full rounded-lg border border-gray-300 pl-7 pr-4 py-2.5 text-sm focus:border-black focus:ring-0" />
                </div>
              </div>
          </AdminCard>

          <AdminCard title="Inventory">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity Available</label>
              <input name="stock_count" type="number" defaultValue={product.stock_count} required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:ring-0" />
            </div>
          </AdminCard>

          <AdminCard title="Organization">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Handle (Slug)</label>
              <input name="handle" type="text" defaultValue={product.handle} required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:ring-0" />
              <p className="mt-1 text-xs text-gray-400">Used for product URL</p>
            </div>
          </AdminCard>
        </div>
      </form>
    </div>
  )
}