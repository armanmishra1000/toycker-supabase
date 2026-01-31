import { getAdminCategories, deleteCategory } from "@/lib/data/admin"
import Link from "next/link"
import { FolderIcon, ArrowTopRightOnSquareIcon, PencilIcon } from "@heroicons/react/24/outline"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import { AdminPagination } from "@modules/admin/components/admin-pagination"
import { AdminSearchInput } from "@modules/admin/components/admin-search-input"
import { CreateCategoryButton } from "./create-category-button"
import { DeleteCategoryButton } from "./delete-category-button"
import { ProtectedAction } from "@/lib/permissions/components/protected-action"
import { PERMISSIONS } from "@/lib/permissions"
import { AdminTableWrapper } from "@modules/admin/components/admin-table-wrapper"

export default async function AdminCategories({
  searchParams
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const { page = "1", search = "" } = await searchParams
  const pageNumber = parseInt(page, 10) || 1

  const { categories, count, totalPages, currentPage } = await getAdminCategories({
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
    return queryString ? `/admin/categories?${queryString}` : "/admin/categories"
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Categories"
        actions={
          <ProtectedAction permission={PERMISSIONS.CATEGORIES_CREATE} hideWhenDisabled>
            <CreateCategoryButton />
          </ProtectedAction>
        }
      />

      {/* Search Bar */}
      <AdminSearchInput defaultValue={search} basePath="/admin/categories" placeholder="Search categories by name or handle..." />

      {/* Results Count */}
      <div className="text-sm text-gray-500">
        Showing {count > 0 ? ((currentPage - 1) * 20) + 1 : 0} to {Math.min(currentPage * 20, count)} of {count} categories
      </div>

      <div className="p-0 border-none shadow-none bg-transparent">
        <AdminTableWrapper className="bg-white rounded-xl border border-admin-border shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#f7f8f9]">
              <tr>
                <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category Info</th>
                <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Availability</th>
                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {categories.length > 0 ? categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-gray-50 text-gray-400 border border-gray-200 group-hover:bg-white transition-all shadow-sm">
                        <FolderIcon className="h-5 w-5" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-gray-900 leading-tight">{category.name}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5">/{category.handle}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-[13px] text-gray-600 font-medium">
                      {category.products?.[0]?.count || 0} products listed
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={`/categories/${category.handle}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                        title="View on store"
                      >
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                      </a>
                      <ProtectedAction permission={PERMISSIONS.CATEGORIES_UPDATE} hideWhenDisabled>
                        <Link
                          href={`/admin/categories/${category.id}`}
                          className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                          title="Edit category"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                      </ProtectedAction>
                      <ProtectedAction permission={PERMISSIONS.CATEGORIES_DELETE} hideWhenDisabled>
                        <DeleteCategoryButton categoryId={category.id} deleteAction={deleteCategory} />
                      </ProtectedAction>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <FolderIcon className="h-10 w-10 text-gray-200 mb-3" />
                      <p className="text-sm font-bold text-gray-900">No categories found</p>
                      {hasSearch ? (
                        <p className="text-xs text-gray-400 mt-1">
                          Try adjusting your search or{" "}
                          <Link href={buildUrl()} className="text-indigo-600 hover:underline">
                            clear the search
                          </Link>
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 mt-1">Organize products into groups for easier browsing.</p>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </AdminTableWrapper>

        {/* Pagination */}
        <AdminPagination currentPage={currentPage} totalPages={totalPages} />
      </div>
    </div>
  )
}
