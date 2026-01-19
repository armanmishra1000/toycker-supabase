import { getAdminCollection, updateCollection, getAdminProducts, getCollectionProducts } from "@/lib/data/admin"
import { SubmitButton } from "@/modules/admin/components"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeftIcon } from "@heroicons/react/24/outline"
import AdminCard from "@modules/admin/components/admin-card"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import { ProductCheckboxList } from "@/modules/admin/components/product-checkbox-list"

export default async function EditCollection({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const collection = await getAdminCollection(id)

  if (!collection) notFound()

  // Fetch all products and currently selected ones
  const { products } = await getAdminProducts({ limit: -1 })
  const selectedProductIds = await getCollectionProducts(id)

  return (
    <div className="space-y-8">
      <nav className="flex items-center gap-2 text-sm font-medium text-gray-500">
        <Link href="/admin/collections" className="flex items-center hover:text-gray-900 transition-colors">
          <ChevronLeftIcon className="h-4 w-4 mr-1" />
          Collections
        </Link>
      </nav>

      <AdminPageHeader title={collection.title} />

      <form action={updateCollection}>
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

            {/* Products section */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Products
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Select products for this collection
              </p>
              <div className="h-[450px] border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
                <ProductCheckboxList
                  products={products}
                  selectedProductIds={selectedProductIds}
                />
              </div>
            </div>
          </div>
        </AdminCard>

        <div className="flex gap-2 mt-6">
          <Link href="/admin/collections" className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">Discard</Link>
          <SubmitButton loadingText="Saving...">
            Save Changes
          </SubmitButton>
        </div>
      </form>
    </div>
  )
}