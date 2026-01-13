import { createCategory } from "@/lib/data/admin"
import { SubmitButton } from "@/modules/admin/components"
import Link from "next/link"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import { ChevronLeftIcon } from "@heroicons/react/24/outline"

export default function NewCategory() {
  return (
    <div className="space-y-8">
      <nav className="flex items-center gap-2 text-sm font-medium text-gray-500">
        <Link href="/admin/categories" className="flex items-center hover:text-gray-900">
          <ChevronLeftIcon className="h-4 w-4 mr-1" />
          Categories
        </Link>
      </nav>

      <AdminPageHeader title="Add Category" />

      <form action={createCategory}>
        <div title="Basic Info">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
              <input name="name" type="text" placeholder="e.g. Action Figures" required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:ring-0" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Handle (Slug)</label>
              <input name="handle" type="text" placeholder="action-figures" required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:ring-0" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
              <textarea name="description" rows={4} placeholder="What kind of toys are in this category?" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:ring-0" />
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6 pt-6 border-t">
          <Link href="/admin/categories" className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900">Cancel</Link>
          <SubmitButton loadingText="Saving...">
            Save Category
          </SubmitButton>
        </div>
      </form>
    </div>
  )
}