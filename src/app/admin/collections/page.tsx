import { getAdminCollections, deleteCollection } from "@/lib/data/admin"
import Link from "next/link"
import { PlusIcon, PencilIcon, TrashIcon, Square3Stack3DIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import AdminCard from "@modules/admin/components/admin-card"

export default async function AdminCollections() {
  const collections = await getAdminCollections()

  const actions = (
    <Link 
      href="/admin/collections/new"
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg shadow-sm text-white bg-black hover:bg-gray-800 transition-colors"
    >
      <PlusIcon className="h-4 w-4 mr-2" />
      Create collection
    </Link>
  )

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Collections" actions={actions} />

      <AdminCard className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Products</th>
                <th className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {collections.length > 0 ? collections.map((collection) => (
                <tr key={collection.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                        <Square3Stack3DIcon className="h-5 w-5" />
                      </div>
                      <div className="ml-4">
                        <div className="font-semibold text-gray-900">{collection.title}</div>
                        <div className="text-xs text-gray-500 font-medium">/{collection.handle}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-medium">
                    {collection.products?.[0]?.count || 0} products
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a 
                        href={`/collections/${collection.handle}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2 text-gray-400 hover:text-gray-900 rounded-md hover:bg-gray-100"
                        title="View on store"
                      >
                        <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                      </a>
                      <Link href={`/admin/collections/${collection.id}`} className="p-2 text-gray-400 hover:text-gray-900 rounded-md hover:bg-gray-100">
                        <PencilIcon className="h-5 w-5" />
                      </Link>
                      <form action={deleteCollection.bind(null, collection.id)}>
                        <button className="p-2 text-gray-400 hover:text-rose-600 rounded-md hover:bg-rose-50">
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-500 font-medium">
                    No collections found. Create one to organize your products.
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