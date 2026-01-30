import { getAdminProducts } from "@/lib/data/admin"
import Link from "next/link"
import Image from "next/image"
import { PlusIcon, PencilIcon, TagIcon, ArrowTopRightOnSquareIcon, PhotoIcon } from "@heroicons/react/24/outline"
import { convertToLocale } from "@lib/util/money"
import AdminBadge from "@modules/admin/components/admin-badge"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import ProductCsvImport from "@modules/admin/components/product-csv-import"
import { AdminPagination } from "@modules/admin/components/admin-pagination"
import { AdminSearchInput } from "@modules/admin/components/admin-search-input"
import { cn } from "@lib/util/cn"
import DeleteProductButton from "@modules/admin/components/delete-product-button"
import { ProtectedAction } from "@/lib/permissions/components/protected-action"
import { PERMISSIONS } from "@/lib/permissions"
import { ClickableTableRow } from "@modules/admin/components/clickable-table-row"
import { CreateProductButton } from "./create-product-button"

export default async function AdminProducts({
  searchParams
}: {
  searchParams: Promise<{ page?: string; status?: string; search?: string }>
}) {
  const { page = "1", status = 'all', search = '' } = await searchParams
  const pageNumber = parseInt(page, 10) || 1

  const { products, count, totalPages, currentPage } = await getAdminProducts({
    page: pageNumber,
    limit: 20,
    status,
    search: search || undefined
  })

  const TABS = [
    { label: "All", value: "all" },
    { label: "Active", value: "active" },
    { label: "Draft", value: "draft" },
    { label: "Archived", value: "archived" },
  ]

  const hasSearch = search && search.trim().length > 0
  const buildUrl = (newStatus: string, newPage?: number, clearSearch = false) => {
    const params = new URLSearchParams()
    params.set("status", newStatus)
    if (newPage && newPage > 1) {
      params.set("page", newPage.toString())
    }
    if (!clearSearch && hasSearch) {
      params.set("search", search)
    }
    const queryString = params.toString()
    return queryString ? `/admin/products?${queryString}` : "/admin/products"
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Products"
        actions={
          <div className="flex items-center gap-3">
            <ProtectedAction permission={PERMISSIONS.PRODUCTS_CREATE} hideWhenDisabled>
              <ProductCsvImport />
            </ProtectedAction>
            <ProtectedAction permission={PERMISSIONS.PRODUCTS_CREATE} hideWhenDisabled>
              <CreateProductButton />
            </ProtectedAction>
          </div>
        }
      />

      {/* Search Bar - Auto-searches when typing stops */}
      <AdminSearchInput defaultValue={search} basePath="/admin/products" placeholder="Search products by name or handle..." />

      {/* Results Count */}
      <div className="text-sm text-gray-500">
        Showing {count > 0 ? ((currentPage - 1) * 20) + 1 : 0} to {Math.min(currentPage * 20, count)} of {count} products
      </div>

      <div className="p-0 border-none shadow-none bg-transparent">
        <div className="bg-white rounded-xl border border-admin-border overflow-x-auto shadow-sm">
          {/* Tabs */}
          <div className="border-b border-gray-200 px-4">
            <div className="flex space-x-6">
              {TABS.map((tab) => (
                <Link
                  key={tab.value}
                  href={buildUrl(tab.value)}
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
                <ClickableTableRow
                  key={product.id}
                  href={`/admin/products/${product.id}`}
                  className="hover:bg-gray-50 transition-colors group cursor-pointer"
                >
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
                    <div>
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors uppercase">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.handle}</p>
                    </div>
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
                    <div className="flex justify-end gap-1 relative z-20">
                      <a
                        href={`/products/${product.handle}`}
                        target="_blank"
                        className="p-2 text-gray-400 hover:text-black transition-colors"
                        title="Preview store"
                      >
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                      </a>
                      <ProtectedAction permission={PERMISSIONS.PRODUCTS_UPDATE} hideWhenDisabled>
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="p-2 text-gray-400 hover:text-black transition-colors"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                      </ProtectedAction>
                      <ProtectedAction permission={PERMISSIONS.PRODUCTS_DELETE} hideWhenDisabled>
                        <DeleteProductButton
                          productId={product.id}
                          productName={product.name}
                          variant="icon"
                        />
                      </ProtectedAction>
                    </div>
                  </td>
                </ClickableTableRow>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <TagIcon className="h-10 w-10 text-gray-200 mb-3" />
                      <p className="text-sm font-bold text-gray-900">No products found</p>
                      {hasSearch ? (
                        <p className="text-xs text-gray-400 mt-1">
                          Try adjusting your search or{" "}
                          <Link href={buildUrl(status)} className="text-indigo-600 hover:underline">
                            clear the search
                          </Link>
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 mt-1">Try changing your filters or adding a new product.</p>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <AdminPagination currentPage={currentPage} totalPages={totalPages} />
      </div>
    </div>
  )
}