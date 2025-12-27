import { Suspense } from "react"
import { retrieveCustomer } from "@lib/data/customer"
import { retrieveProduct } from "@lib/data/products"
import ProductActions from "@modules/products/components/product-actions"
import { WishlistProvider } from "@modules/products/context/wishlist"

/**
 * Fetches real time pricing for a product and renders the product actions component.
 * Wrapped in Suspense to handle Client Component de-optimization from useSearchParams.
 */
export default async function ProductActionsWrapper({
  id,
  region,
}: {
  id: string
  region: any
}) {
  const customerPromise = retrieveCustomer()
  const product = await retrieveProduct(id)

  const customer = await customerPromise

  if (!product) {
    return null
  }

  const accountPath = "/account"

  return (
    <WishlistProvider isAuthenticated={Boolean(customer)} loginPath={accountPath}>
      <Suspense fallback={<div className="h-64 w-full animate-pulse bg-gray-100 rounded-xl" />}>
        <ProductActions product={product} />
      </Suspense>
    </WishlistProvider>
  )
}