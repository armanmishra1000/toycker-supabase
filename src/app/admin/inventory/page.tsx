import { getAdminProducts, getLowStockStats } from "@/lib/data/admin"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import { AdminPagination } from "@modules/admin/components/admin-pagination"
import { AdminSearchInput } from "@modules/admin/components/admin-search-input"
import { ArrowPathIcon } from "@heroicons/react/24/outline"
import InventoryTable from "@modules/admin/components/inventory-table"
import Link from "next/link"
import { ArchiveBoxIcon } from "@heroicons/react/24/outline"
import { AlertCircle } from "lucide-react"
import { cn } from "@lib/util/cn"

export default async function AdminInventory({
  searchParams
}: {
  searchParams: Promise<{ page?: string; search?: string; stock_status?: string }>
}) {
  const { page = "1", search = "", stock_status = "all" } = await searchParams
  const pageNumber = parseInt(page, 10) || 1

  const { products, count, totalPages, currentPage } = await getAdminProducts({
    page: pageNumber,
    limit: 20,
    search: search || undefined,
    stock_status: stock_status as any
  })

  const lowStockStats = await getLowStockStats()

  const hasSearch = search && search.trim().length > 0
  const buildUrl = (newPage?: number, clearSearch = false, newStockStatus?: string) => {
    const params = new URLSearchParams()
    if (newPage && newPage > 1) {
      params.set("page", newPage.toString())
    }
    if (!clearSearch && hasSearch) {
      params.set("search", search)
    }

    const activeStockStatus = newStockStatus || stock_status
    if (activeStockStatus && activeStockStatus !== "all") {
      params.set("stock_status", activeStockStatus)
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
            Update
          </button>
        }
      />

      {/* Low Stock Alert */}
      {(lowStockStats.lowStock > 0 || lowStockStats.outOfStock > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="bg-amber-100 p-2 rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-amber-900">Inventory Attention Required</h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
              {lowStockStats.lowStock > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <p className="text-xs text-amber-700 font-medium">
                    <span className="font-black">{lowStockStats.lowStock}</span> items are low on stock
                  </p>
                </div>
              )}
              {lowStockStats.outOfStock > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <p className="text-xs text-amber-700 font-medium">
                    <span className="font-black text-red-600">{lowStockStats.outOfStock}</span> items are out of stock
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-px">
        <Link
          href={buildUrl(1, false, "all")}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-all relative",
            stock_status === "all" ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"
          )}
        >
          All Products
          {stock_status === "all" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
        </Link>
        <Link
          href={buildUrl(1, false, "out_of_stock")}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-all relative flex items-center gap-2",
            stock_status === "out_of_stock" ? "text-red-600" : "text-gray-500 hover:text-gray-700"
          )}
        >
          Out of Stock
          {lowStockStats.outOfStock > 0 && <span className="flex h-2 w-2 rounded-full bg-red-500" />}
          {stock_status === "out_of_stock" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" />}
        </Link>
        <Link
          href={buildUrl(1, false, "low_stock")}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-all relative flex items-center gap-2",
            stock_status === "low_stock" ? "text-amber-600" : "text-gray-500 hover:text-gray-700"
          )}
        >
          Low Stock
          {lowStockStats.lowStock > 0 && <span className="flex h-2 w-2 rounded-full bg-amber-500" />}
          {stock_status === "low_stock" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600" />}
        </Link>
      </div>

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
