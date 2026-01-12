import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { Product as SupabaseProduct } from "@/lib/supabase/types"
import ProductPreview from "../product-preview"

type RelatedProductsProps = {
  product: SupabaseProduct
  countryCode: string
  clubDiscountPercentage?: number
}

export default async function RelatedProducts({
  product,
  countryCode: _countryCode,
  clubDiscountPercentage,
}: RelatedProductsProps) {
  const region = await getRegion()

  if (!region) {
    return null
  }

  const { response: { products: allProducts } } = await listProducts()
  const products = allProducts.filter(p => p.id !== product.id).slice(0, 4)

  if (!products.length) {
    return null
  }

  return (
    <div className="product-page-constraint">
      <div className="flex flex-col items-center text-center mb-16">
        <span className="text-base-regular text-gray-600 mb-6">
          Related products
        </span>
        <p className="text-2xl-regular text-ui-fg-base max-w-lg">
          You might also want to check out these products.
        </p>
      </div>

      <ul className="grid small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8">
        {products.map((p) => (
          <li key={p.id}>
            <ProductPreview
              product={p}
              clubDiscountPercentage={clubDiscountPercentage}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}