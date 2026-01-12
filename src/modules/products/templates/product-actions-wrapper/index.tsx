import { Suspense } from "react"
import { retrieveProduct } from "@lib/data/products"
import ProductActions from "@modules/products/components/product-actions"

/**
 * Fetches real time pricing for a product and renders the product actions component.
 * Wrapped in Suspense to handle Client Component de-optimization from useSearchParams.
 */
export default async function ProductActionsWrapper({
  id,
  region: _region,
  clubDiscountPercentage,
}: {
  id: string
  region: any
  clubDiscountPercentage?: number
}) {
  const product = await retrieveProduct(id)

  if (!product) {
    return null
  }

  return (
    <Suspense fallback={<div className="h-64 w-full animate-pulse bg-gray-100 rounded-xl" />}>
      <ProductActions product={product} clubDiscountPercentage={clubDiscountPercentage} />
    </Suspense>
  )
}