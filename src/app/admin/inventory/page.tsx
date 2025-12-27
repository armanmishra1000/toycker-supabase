import { getAdminProducts } from "@/lib/data/admin"
import AdminCard from "@modules/admin/components/admin-card"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import Image from "next/image"
import Link from "next/link"
import { TagIcon, BoxIcon, ArrowPathIcon } from "@heroicons/react/24/outline"

export default async function AdminInventory() {
  const products = await getAdminProducts()

  return (
    <div className="space-y-6">
      <AdminPageHeader 
        title="Inventory" 
        actions={
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-bold rounded-lg hover:bg-white transition-all gap-2">
            <ArrowPathIcon className="h-4 w-4" />
            Update stock
          </button>
        }
      />

      <AdminCard className="p-0 border-none shadow-none bg-transparent">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest w-1/2">Product</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">SKU</th>
                <th className="px-6 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Unavailable</th>
                <th className="px-6 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Committed</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Available</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 relative rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
                        {product.image_url ? (
                          <Image src={product.image_url} alt="" fill className="object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-300">
                            <TagIcon className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <Link href={`/admin/products/${product.id}`} className="text-sm font-bold text-gray-900 hover:underline">{product.name}</Link>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-gray-400 font-mono">
                    {product.variants?.[0]?.sku || '---'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-400">0</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-400">0</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <input 
                      type="number" 
                      defaultValue={product.stock_count}
                      className="w-20 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-bold text-right focus:border-black focus:ring-0 transition-all bg-gray-50/50"
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