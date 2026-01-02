import { getAdminCollections, updateProduct, getProductVariants, getProductCollections, getAdminCategories, getProductCategories } from "@/lib/data/admin"
import Link from "next/link"
import { retrieveProduct } from "@lib/data/products"
import { notFound } from "next/navigation"
import { ChevronLeftIcon } from "@heroicons/react/24/outline"
import EditProductForm from "@modules/admin/components/edit-product-form"

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [product, collectionsData, categoriesData, variants, productCollections, productCategoriesIds] = await Promise.all([
    retrieveProduct(id),
    getAdminCollections({ limit: -1 }),
    getAdminCategories({ limit: -1 }),
    getProductVariants(id),
    getProductCollections(id),
    getProductCategories(id)
  ])

  const collections = collectionsData.collections
  const categories = categoriesData.categories

  // Get selected collection IDs, merging from product_collections junction and primary collection_id
  const productCollectionIds = productCollections.map(c => c.id)
  if (product?.collection_id && !productCollectionIds.includes(product.collection_id)) {
    productCollectionIds.push(product.collection_id)
  }
  const selectedCollectionIds = Array.from(new Set(productCollectionIds.filter(Boolean)))

  // Get selected category IDs
  const productCategoryIds = productCategoriesIds || []
  if (product?.category_id && !productCategoryIds.includes(product.category_id)) {
    productCategoryIds.push(product.category_id)
  }
  const selectedCategoryIds = Array.from(new Set(productCategoryIds.filter(Boolean)))

  if (!product) notFound()

  return (
    <div className="space-y-6">
      <nav className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest">
        <Link href="/admin/products" className="flex items-center hover:text-black transition-colors">
          <ChevronLeftIcon className="h-3 w-3 mr-1" strokeWidth={3} />
          Products
        </Link>
      </nav>

      <EditProductForm
        product={product}
        variants={variants}
        categories={categories}
        collections={collections}
        selectedCategoryIds={selectedCategoryIds}
        selectedCollectionIds={selectedCollectionIds}
      />
    </div>
  )
}