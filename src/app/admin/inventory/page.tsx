import { getAdminProducts } from "@/lib/data/admin"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import { AdminPagination } from "@modules/admin/components/admin-pagination"
import { AdminSearchInput } from "@modules/admin/components/admin-search-input"
import { ArrowPathIcon } from "@heroicons/react/24/outline"
import InventoryTable from "@modules/admin/components/inventory-table"
import Link from "next/link"
import { ArchiveBoxIcon } from "@heroicons/react/24/outline"

export default async function AdminInventory({
  searchParams
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const { page = "1", search = "" } = await searchParams
  const pageNumber = parseInt(page, 10) || 1

  const { products, count, totalPages, currentPage } = await getAdminProducts({
    page: pageNumber,
    limit: 20,
    search: search || undefined
  })

  const hasSearch = search && search.trim().length > 0
  const buildUrl = (newPage?: number, clearSearch = false) => {
    const params = new URLSearchParams()
    if (newPage && newPage > 1) {
      params.set("page", newPage.toString())
    }
    if (!clearSearch && hasSearch) {
      params.set("search", search)
    }
    const queryString = params.toString()
    return queryString ? `/admin/inventory?${queryString}` : "/admin/inventory"
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Inventory"
        subtitle="Track and adjust inventory levels."
        actions={
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all gap-2">
            <ArrowPathIcon className="h-4 w-4" />
            Bulk Update
          </button>
        }
      />

      {/* Search Bar */}
      <AdminSearchInput defaultValue={search} basePath="/admin/inventory" placeholder="Search products by name or handle..." />

      {/* Results Count */}
      <div className="text-sm text-gray-500">
        Showing {count > 0 ? ((currentPage - 1) * 20) + 1 : 0} to {Math.min(currentPage * 20, count)} of {count} products
      </div>

      <div className="p-0 border-none shadow-none bg-transparent">
        {products.length > 0 ? (
          <InventoryTable initialProducts={products as any} />
        ) : (
          <div className="bg-white rounded-xl border border-admin-border overflow-hidden shadow-sm p-20 text-center">
            <div className="flex flex-col items-center">
              <ArchiveBoxIcon className="h-10 w-10 text-gray-200 mb-3" />
              <p className="text-sm font-bold text-gray-900">No products found</p>
              {hasSearch ? (
                <p className="text-xs text-gray-400 mt-1">
                  Try adjusting your search or{" "}
                  <Link href={buildUrl()} className="text-indigo-600 hover:underline">
                    clear the search
                  </Link>
                </p>
              ) : (
                <p className="text-xs text-gray-400 mt-1">No products in inventory yet.</p>
              )}
            </div>
          </div>
        )}

        {/* Pagination */}
        <AdminPagination currentPage={currentPage} totalPages={totalPages} />
      </div>
    </div>
  )
}
