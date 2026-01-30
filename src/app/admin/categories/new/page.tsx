import { createCategory, getAdminProducts } from "@/lib/data/admin"
import Link from "next/link"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import { ChevronLeftIcon } from "@heroicons/react/24/outline"
import { CategoryForm } from "@/modules/admin/components/category-form"

export default async function NewCategory() {
  // Fetch all products for selection
  const { products } = await getAdminProducts({ limit: -1 })

  return (
    <div className="space-y-8">
      <nav className="flex items-center gap-2 text-sm font-medium text-gray-500">
        <Link href="/admin/categories" className="flex items-center hover:text-gray-900 transition-colors">
          <ChevronLeftIcon className="h-4 w-4 mr-1" />
          Categories
        </Link>
      </nav>

      <AdminPageHeader title="Add Category" />

      <CategoryForm
        products={products}
        action={createCategory}
      />
    </div>
  )
}