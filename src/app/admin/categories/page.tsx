import { getAdminCategories, deleteCategory } from "@/lib/data/admin"
import Link from "next/link"
import { PlusIcon, TrashIcon, FolderIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import AdminCard from "@modules/admin/components/admin-card"

export default async function AdminCategories() {
  const categories = await getAdminCategories()

  const actions = (
    <Link 
      href="/admin/categories/new"
      className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-bold rounded-lg shadow-sm text-white bg-black hover:bg-gray-800 transition-all"
    >
      <PlusIcon className="h-4 w-4 mr-2" strokeWidth={3} />
      Add category
    </Link>
  )

  return (
    <div className="space-y-8">
      <AdminPageHeader title="Categories" actions={actions} />

      <AdminCard className="p-0 border-none shadow-none bg-transparent">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category Name</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">URL Handle</th>
                <th className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {categories.length > 0 ? categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-gray-50 text-gray-400 border border-gray-100 group-hover:border-black group-hover:text-black transition-all">
                        <FolderIcon className="h-5 w-5" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-gray-900">{category.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                    /{category.handle}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a 
                        href={`/categories/${category.handle}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2 text-gray-400 hover:text-black transition-colors"
                        title="View on store"
                      >
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                      </a>
                      <form action={deleteCategory.bind(null, category.id)}>
                        <button className="p-2 text-gray-400 hover:text-rose-600 transition-colors">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-400 text-sm font-medium">
                    No categories found. Organize products into groups for easier browsing.
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