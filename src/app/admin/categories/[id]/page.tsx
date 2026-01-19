import { getAdminCategory, updateCategory, getAdminProducts, getCategoryProducts } from "@/lib/data/admin"
import { SubmitButton } from "@/modules/admin/components"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeftIcon } from "@heroicons/react/24/outline"
import AdminCard from "@modules/admin/components/admin-card"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import { ProductCheckboxList } from "@/modules/admin/components/product-checkbox-list"

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

            <form action={updateCategory}>
                <input type="hidden" name="id" value={category.id} />
                <AdminCard title="General Information">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                                <input name="name" type="text" defaultValue={category.name} required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:ring-0" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Handle (Slug)</label>
                                <input name="handle" type="text" defaultValue={category.handle} required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:ring-0" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                            <textarea name="description" rows={3} defaultValue={category.description || ""} placeholder="Category description..." className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:ring-0" />
                        </div>

                        {/* Products section */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Products
                            </label>
                            <p className="text-xs text-gray-500 mb-3">
                                Select products for this category
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

                <div className="flex gap-2 mt-8">
                    <Link href="/admin/categories" className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">Discard</Link>
                    <SubmitButton loadingText="Saving...">
                        Save Changes
                    </SubmitButton>
                </div>
            </form>
        </div>
    )
}
