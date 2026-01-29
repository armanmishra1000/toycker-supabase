import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { Product as SupabaseProduct } from "@/lib/supabase/types"
import ProductPreview from "../product-preview"
import RelatedProductsCarousel from "./related-products-carousel"

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
      <div className="flex flex-col items-center text-center md:mb-10 mb-6">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
          Related products
        </h2>
      </div>

      <RelatedProductsCarousel
        products={products}
        clubDiscountPercentage={clubDiscountPercentage}
      />
    </div>
  )
}