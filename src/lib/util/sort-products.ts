import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/types"

interface MinPricedProduct extends HttpTypes.StoreProduct {
  _minPrice?: number
}

/**
 * Helper function to sort products by price until the store API supports sorting by price
 * @param products
 * @param sortBy
 * @returns products sorted by price
 */
export function sortProducts(
  products: HttpTypes.StoreProduct[],
  sortBy: SortOptions
): HttpTypes.StoreProduct[] {
  const requiresPriceSort = sortBy === "price_asc" || sortBy === "price_desc"

  if (!requiresPriceSort) {
    return products
  }

  const sortedProducts = [...products] as MinPricedProduct[]

  sortedProducts.forEach((product) => {
    if (product.variants && product.variants.length > 0) {
      product._minPrice = Math.min(
        ...product.variants.map(
          (variant) => variant?.calculated_price?.calculated_amount || 0
        )
      )
    } else {
      product._minPrice = Infinity
    }
  })

  sortedProducts.sort((a, b) => {
    const diff = (a._minPrice ?? Infinity) - (b._minPrice ?? Infinity)
    return sortBy === "price_asc" ? diff : -diff
  })

  return sortedProducts
}
