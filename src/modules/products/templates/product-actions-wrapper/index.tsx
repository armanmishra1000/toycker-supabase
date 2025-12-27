import { retrieveCustomer } from "@lib/data/customer"
import { retrieveProduct } from "@lib/data/products"
import ProductActions from "@modules/products/components/product-actions"
import { WishlistProvider } from "@modules/products/context/wishlist"

/**
 * Fetches real time pricing for a product and renders the product actions component.
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
      <ProductActions product={product} />
    </WishlistProvider>
  )
}