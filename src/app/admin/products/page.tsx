import { getAdminProducts, deleteProduct } from "@/lib/data/admin"
import Link from "next/link"
import Image from "next/image"
import { PlusIcon, PencilIcon, TrashIcon, TagIcon, ArrowTopRightOnSquareIcon, PhotoIcon } from "@heroicons/react/24/outline"
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

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Products"
        actions={
          <Link href="/admin/products/new" className="inline-flex items-center px-4 py-2 bg-gray-900 border border-transparent rounded-lg font-medium text-xs text-white hover:bg-black transition-colors shadow-sm">
            <PlusIcon className="h-4 w-4 mr-2" />
            Add product
          </Link>
        }
      />

      <AdminCard className="p-0 border-none shadow-none bg-transparent">
        <div className="bg-white rounded-xl border border-admin-border overflow-hidden shadow-sm">
          {/* Tabs */}
          <div className="border-b border-gray-200 px-4">
            <div className="flex space-x-6">
              {TABS.map((tab) => (
                <Link
                  key={tab.value}
                  href={`/admin/products?status=${tab.value}`}
                  className={cn(
                    "py-3 text-sm font-medium border-b-2 transition-colors capitalize",
                    status === tab.value
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  )}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
          </div>

          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#f7f8f9]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[80px]">Image</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inventory</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[50px]"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {products.length > 0 ? products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
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
                        <PhotoIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/admin/products/${product.id}`} className="block">
                      <p className="text-sm font-semibold text-gray-900 hover:underline">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.handle}</p>
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <AdminBadge variant={product.status === 'active' ? "success" : product.status === 'archived' ? "neutral" : "info"}>
                      <span className="capitalize">{product.status}</span>
                    </AdminBadge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={product.stock_count > 0 ? "text-gray-600" : "text-red-600 font-medium"}>
                      {product.stock_count} in stock
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
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