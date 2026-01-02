import { getAdminCollections, getAdminCategories } from "@/lib/data/admin"
import Link from "next/link"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import { ChevronLeftIcon } from "@heroicons/react/24/outline"
import NewProductForm from "@modules/admin/components/new-product-form"

export default async function NewProduct() {
  const [collectionsData, categoriesData] = await Promise.all([
    getAdminCollections(),
    getAdminCategories()
  ])

  const collections = collectionsData.collections
  const categories = categoriesData.categories

  return (
    <div className="space-y-6">
      <nav className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest">
        <Link href="/admin/products" className="flex items-center hover:text-black transition-colors">
          <ChevronLeftIcon className="h-3 w-3 mr-1" strokeWidth={3} />
          Back to Products
        </Link>
      </nav>

      <AdminPageHeader title="Add Product" />

      <NewProductForm 
        collections={collections} 
        categories={categories} 
      />
    </div>
  )
}