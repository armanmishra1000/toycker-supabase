import { getAdminCategory, updateCategory, getAdminProducts, getCategoryProducts } from "@/lib/data/admin"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeftIcon } from "@heroicons/react/24/outline"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import { CategoryForm } from "@/modules/admin/components/category-form"

export default async function EditCategory({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const category = await getAdminCategory(id)

    if (!category) notFound()

    // Fetch all products and currently selected ones
    const { products } = await getAdminProducts({ limit: -1 })
    const selectedProductIds = await getCategoryProducts(id)

    return (
        <div className="space-y-8">
            <nav className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <Link href="/admin/categories" className="flex items-center hover:text-gray-900 transition-colors">
                    <ChevronLeftIcon className="h-4 w-4 mr-1" />
                    Categories
                </Link>
            </nav>

            <AdminPageHeader title={category.name} />

            <CategoryForm
                category={category}
                products={products}
                selectedProductIds={selectedProductIds}
                action={updateCategory}
            />
        </div>
    )
}
