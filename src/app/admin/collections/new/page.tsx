import { createCollection, getAdminProducts } from "@/lib/data/admin"
import { SubmitButton } from "@/modules/admin/components"
import Link from "next/link"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import { ChevronLeftIcon } from "@heroicons/react/24/outline"
import { ProductCheckboxList } from "@/modules/admin/components/product-checkbox-list"

export default async function NewCollection() {
  // Fetch all products for selection
  const { products } = await getAdminProducts({ limit: -1 })

  return (
    <div className="space-y-8">
      <nav className="flex items-center gap-2 text-sm font-medium text-gray-500">
        <Link href="/admin/collections" className="flex items-center hover:text-gray-900">
          <ChevronLeftIcon className="h-4 w-4 mr-1" />
          Collections
        </Link>
      </nav>

      <AdminPageHeader title="Create Collection" />

      <form action={createCollection}>
        <div title="General Information">
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

            {/* Products section */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Products
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Select products to add to this collection
              </p>
              <div className="h-[450px] border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
                <ProductCheckboxList
                  products={products}
                  selectedProductIds={[]}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6 pt-6 border-t">
          <Link href="/admin/collections" className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900">Cancel</Link>
          <SubmitButton loadingText="Saving...">
            Save Collection
          </SubmitButton>
        </div>
      </form>
    </div>
  )
}