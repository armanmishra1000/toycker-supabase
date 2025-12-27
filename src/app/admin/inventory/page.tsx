import { getAdminProducts } from "@/lib/data/admin"
import AdminCard from "@modules/admin/components/admin-card"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import Image from "next/image"
import Link from "next/link"
import { TagIcon, ArchiveBoxIcon, ArrowPathIcon } from "@heroicons/react/24/outline"

export default async function AdminInventory() {
  const products = await getAdminProducts()

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Inventory"
        subtitle="Track and adjust inventory levels."
        actions={
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all gap-2">
            <ArrowPathIcon className="h-4 w-4" />
            Update stock
          </button>
        }
      />

      <AdminCard className="p-0 border-none shadow-none bg-transparent">
        <div className="bg-white rounded-xl border border-admin-border overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#f7f8f9]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[80px]">Image</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Unavailable</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Committed</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
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
                    {product.variants?.[0]?.sku || '---'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">0</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">0</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <input
                      type="number"
                      defaultValue={product.stock_count}
                      className="w-24 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-900 text-right focus:border-indigo-500 focus:ring-indigo-500 transition-all"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  )
}