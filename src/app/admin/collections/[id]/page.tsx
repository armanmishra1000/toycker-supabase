import { getAdminCollection, updateCollection } from "@/lib/data/admin"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeftIcon } from "@heroicons/react/24/outline"
import AdminCard from "@modules/admin/components/admin-card"
import AdminPageHeader from "@modules/admin/components/admin-page-header"

export default async function EditCollection({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const collection = await getAdminCollection(id)

  if (!collection) notFound()

  const actions = (
    <div className="flex gap-2">
      <Link href="/admin/collections" className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">Discard</Link>
      <button form="collection-form" type="submit" className="px-4 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-all shadow-sm">
        Save Changes
      </button>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <nav className="flex items-center gap-2 text-sm font-medium text-gray-500">
        <Link href="/admin/collections" className="flex items-center hover:text-gray-900 transition-colors">
          <ChevronLeftIcon className="h-4 w-4 mr-1" />
          Collections
        </Link>
      </nav>

      <AdminPageHeader title={collection.title} actions={actions} />

      <form id="collection-form" action={updateCollection}>
        <input type="hidden" name="id" value={collection.id} />
        <AdminCard title="General Information">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
              <input name="title" type="text" defaultValue={collection.title} required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:ring-0" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Handle (Slug)</label>
              <input name="handle" type="text" defaultValue={collection.handle} required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:ring-0" />
            </div>
          </div>
        </AdminCard>
      </form>
    </div>
  )
}