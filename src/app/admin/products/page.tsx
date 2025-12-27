import { getAdminProducts, deleteProduct } from "@/lib/data/admin"
import Link from "next/link"
import Image from "next/image"
import { PlusIcon, PencilIcon, TrashIcon, TagIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline"
import { convertToLocale } from "@lib/util/money"
import AdminBadge from "@modules/admin/components/admin-badge"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import AdminCard from "@modules/admin/components/admin-card"
import { cn } from "@lib/util/cn"

export default async function AdminProducts({ 
  searchParams 
}: { 
  searchParams: Promise<{ status?: string }> 
}) {
  const { status = 'all' } = await searchParams
  const products = await getAdminProducts(status)

  const TABS = [
    { label: "All", value: "all" },
    { label: "Active", value: "active" },
    { label: "Draft", value: "draft" },
    { label: "Archived", value: "archived" },
  ]

  const actions = (
    <Link 
      href="/admin/products/new"
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-bold rounded-lg shadow-sm text-white bg-black hover:bg-gray-800 transition-colors"
    >
      <PlusIcon className="h-4 w-4 mr-2" />
      Add product
    </Link>
  )

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Products" actions={actions} />

      <AdminCard className="p-0 border-none shadow-none bg-transparent">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Tabs */}
          <div className="flex border-b border-gray-100 px-4">
            {TABS.map((tab) => (
              <Link
                key={tab.value}
                href={`/admin/products?status=${tab.value}`}
                className={cn(
                  "px-4 py-3 text-sm font-semibold border-b-2 transition-all",
                  status === tab.value 
                    ? "border-black text-black" 
                    : "border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200"
                )}
              >
                {tab.label}
              </Link>
            ))}
          </div>

          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest w-1/2">Product</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Inventory</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Price</th>
                <th className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {products.length > 0 ? products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 relative rounded-lg bg-gray-100 overflow-hidden border border-gray-200 shadow-sm">
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
                        <div className="text-[11px] text-gray-400 font-medium tracking-tight">handle: /{product.handle}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <AdminBadge variant={product.status === 'active' ? "success" : product.status === 'draft' ? "warning" : "neutral"}>
                      {product.status || 'active'}
                    </AdminBadge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.stock_count > 0 ? (
                      <span className="text-xs font-bold text-gray-600">{product.stock_count} in stock</span>
                    ) : (
                      <span className="text-[10px] text-rose-600 font-black uppercase tracking-tighter bg-rose-50 px-2 py-0.5 rounded border border-rose-100">Sold out</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-gray-900 text-right">
                    {convertToLocale({ amount: product.price, currency_code: product.currency_code })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a 
                        href={`/products/${product.handle}`} 
                        target="_blank" 
                        className="p-2 text-gray-400 hover:text-black transition-colors"
                        title="Preview store"
                      >
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                      </a>
                      <Link href={`/admin/products/${product.id}`} className="p-2 text-gray-400 hover:text-black transition-colors">
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                   <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center">
                         <TagIcon className="h-10 w-10 text-gray-200 mb-3" />
                         <p className="text-sm font-bold text-gray-900">No products found</p>
                         <p className="text-xs text-gray-400 mt-1">Try changing your filters or adding a new product.</p>
                      </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  )
}