import { updateProduct, getAdminProducts } from "@/lib/data/admin"
import Link from "next/link"
import { retrieveProduct } from "@lib/data/products"
import { notFound } from "next/navigation"

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await retrieveProduct(id)

  if (!product) notFound()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
        <Link href="/admin/products" className="text-sm text-gray-500 hover:text-gray-900">Cancel</Link>
      </div>

      <form action={updateProduct} className="space-y-6">
        <input type="hidden" name="id" value={product.id} />
        
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input name="name" type="text" defaultValue={product.name} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm h-10 border px-3" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Handle</label>
            <input name="handle" type="text" defaultValue={product.handle} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm h-10 border px-3" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea name="description" rows={4} defaultValue={product.description || ""} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm border p-3" />
          </div>
        </div>

        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Price (INR)</label>
              <input name="price" type="number" defaultValue={product.price} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm h-10 border px-3" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Stock</label>
              <input name="stock_count" type="number" defaultValue={product.stock_count} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm h-10 border px-3" />
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Image URL</label>
            <input name="image_url" type="url" defaultValue={product.image_url || ""} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm h-10 border px-3" />
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  )
}