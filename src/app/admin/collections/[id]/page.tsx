import { getAdminCollection, updateCollection, getAdminProducts, getCollectionProducts } from "@/lib/data/admin"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeftIcon } from "@heroicons/react/24/outline"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import { CollectionForm } from "@/modules/admin/components/collection-form"

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

      <CollectionForm
        collection={collection}
        products={products}
        selectedProductIds={selectedProductIds}
        action={updateCollection}
      />
    </div>
  )
}