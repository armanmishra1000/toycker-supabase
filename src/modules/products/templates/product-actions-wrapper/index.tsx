import { Suspense } from "react"
import { Product } from "@/lib/supabase/types"
import ProductActions from "@modules/products/components/product-actions"

/**
 * Renders the product actions component.
 * Wrapped in Suspense to handle Client Component de-optimization from useSearchParams.
 * 
 * Optimized to accept 'product' as a prop to avoid redundant fetching.
 */
export default function ProductActionsWrapper({
  product,
  region: _region,
  clubDiscountPercentage,
}: {
  product: Product
  region: any
  clubDiscountPercentage?: number
}) {
  return (
    <Suspense fallback={<div className="h-64 w-full animate-pulse bg-gray-100 rounded-xl" />}>
      <ProductActions product={product} clubDiscountPercentage={clubDiscountPercentage} />
    </Suspense>
  )
}