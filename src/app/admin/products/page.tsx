import { getAdminProducts, deleteProduct } from "@/lib/data/admin"
import Link from "next/link"
import Image from "next/image"
import { PlusIcon, PencilIcon, TrashIcon, TagIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline"
import { convertToLocale } from "@lib/util/money"
import AdminBadge from "@modules/admin/components/admin-badge"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import AdminCard from "@modules/admin/components/admin-card"

export default async function AdminProducts() {
  const products = await getAdminProducts()

  const actions = (
    <Link 
      href="/admin/products/new"
      className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-bold rounded-lg shadow-sm text-white bg-black hover:bg-gray-800 transition-colors"
    >
      <PlusIcon className="h-4 w-4 mr-2" />
      Add product
    </Link>
  )

  return (
    <div className="space-y-8">
      <AdminPageHeader title="Products" actions={actions} />

      <AdminCard className="p-0 border-none shadow-none bg-transparent">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Product Info</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Inventory</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Price</th>
                <th className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-12 w-12 flex-shrink-0 relative rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
                        {product.image_url ? (
                          <Image src={product.image_url} alt="" fill className="object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-300">
                            <TagIcon className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-gray-900">{product.name}</div>
                        <div className="text-xs text-gray-400 font-medium tracking-tighter">handle: /{product.handle}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <AdminBadge variant={product.stock_count > 0 ? "success" : "error"}>
                      {product.stock_count > 0 ? 'Active' : 'Archived'}
                    </AdminBadge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.stock_count > 0 ? (
                      <span className="text-xs font-bold text-gray-600">{product.stock_count} in stock</span>
                    ) : (
                      <span className="text-xs text-rose-600 font-bold uppercase tracking-tighter">Out of stock</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-gray-900">
                    {convertToLocale({ amount: product.price, currency_code: product.currency_code })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a 
                        href={`/products/${product.handle}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2 text-gray-400 hover:text-black transition-colors"
                        title="View on store"
                      >
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                      </a>
                      <Link href={`/admin/products/${product.id}`} className="p-2 text-gray-400 hover:text-black transition-colors">
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                      <form action={deleteProduct.bind(null, product.id)}>
                        <button className="p-2 text-gray-400 hover:text-rose-600 transition-colors">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
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