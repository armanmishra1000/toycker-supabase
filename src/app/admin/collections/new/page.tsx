import { createCollection } from "@/lib/data/admin"
import Link from "next/link"
import AdminCard from "@modules/admin/components/admin-card"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import { ChevronLeftIcon } from "@heroicons/react/24/outline"

export default function NewCollection() {
  const actions = (
    <div className="flex gap-2">
      <Link href="/admin/collections" className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900">Cancel</Link>
      <button form="collection-form" type="submit" className="px-4 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-all">
        Save Collection
      </button>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <nav className="flex items-center gap-2 text-sm font-medium text-gray-500">
        <Link href="/admin/collections" className="flex items-center hover:text-gray-900">
          <ChevronLeftIcon className="h-4 w-4 mr-1" />
          Collections
        </Link>
      </nav>

      <AdminPageHeader title="Create Collection" actions={actions} />

      <form id="collection-form" action={createCollection}>
        <AdminCard title="General Information">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
              <input name="title" type="text" placeholder="e.g. Summer Specials" required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:ring-0" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Handle (Slug)</label>
              <input name="handle" type="text" placeholder="summer-specials" required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:ring-0" />
              <p className="mt-1 text-xs text-gray-400">Used for the collection URL</p>
            </div>
          </div>
        </AdminCard>
      </form>
    </div>
  )
}