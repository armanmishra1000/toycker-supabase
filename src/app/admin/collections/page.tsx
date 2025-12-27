import { getAdminCollections, deleteCollection } from "@/lib/data/admin"
import Link from "next/link"
import { PlusIcon, PencilIcon, TrashIcon, RectangleStackIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import AdminCard from "@modules/admin/components/admin-card"

export default async function AdminCollections() {
  const collections = await getAdminCollections()

  const actions = (
    <Link
      href="/admin/collections/new"
      className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-bold rounded-lg shadow-sm text-white bg-black hover:bg-gray-800 transition-all"
    >
      <PlusIcon className="h-4 w-4 mr-2" strokeWidth={3} />
      Create collection
    </Link>
  )

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Collections" subtitle="Group products into collections to make it easier for customers to find them by category." actions={actions} />

      <AdminCard className="p-0 border-none shadow-none bg-transparent">
        <div className="bg-white rounded-xl border border-admin-border overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#f7f8f9]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collection Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Availability</th>
                <th className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {collections.length > 0 ? collections.map((collection) => (
                <tr key={collection.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-gray-50 text-gray-400 border border-gray-200 group-hover:bg-white transition-all">
                        <RectangleStackIcon className="h-5 w-5" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">{collection.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">/{collection.handle}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-gray-600">
                    {collection.products?.[0]?.count || 0} products listed
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={`/collections/${collection.handle}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                        title="View on store"
                      >
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                      </a>
                      <Link href={`/admin/collections/${collection.id}`} className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors">
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                      <form action={deleteCollection.bind(null, collection.id)}>
                        <button className="p-1.5 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded transition-colors">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-500 text-sm">
                    No collections found. Use groupings to organize your shop.
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