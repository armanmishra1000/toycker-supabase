import { Product } from "@/lib/supabase/types"
import { VariantPrice } from "@/types/global"

type GetProductPriceArgs = {
  product: Product
  variantId?: string
  clubDiscountPercentage?: number
}

type ProductPriceResult = {
  product: Product
  variantPrice: VariantPrice | null
  cheapestPrice: VariantPrice | null
}

const formatAmount = (amount: number, currencyCode: string) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currencyCode || "INR",
    minimumFractionDigits: 2,
  }).format(amount)
}

const getPercentageDiff = (original: number, calculated: number) => {
  if (!original) return "0"
  return Math.round(((original - calculated) / original) * 100).toString()
}

export const getProductPrice = ({
  product,
  variantId,
  clubDiscountPercentage = 0,
}: GetProductPriceArgs): ProductPriceResult => {
  if (!product) {
    throw new Error("No product provided")
  }

  const currencyCode = product.currency_code || "INR"

  // Helper to build price object
  const buildPrice = (price: number, originalPrice?: number, compareAtPrice?: number | null): VariantPrice => {
    // Use compare_at_price if available, otherwise fall back to originalPrice
    const original = compareAtPrice || originalPrice || price

    // Calculate Club Price
    // Club price is applied on the PAYABLE price (calculated_price_number)
    // If the product is already on sale (compare_at_price), club discount is usually on top of that
    // OR on the sale price?
    // Plan said: "Club members get discounted 'Club Price' on all products (percentage set in admin)"
    // Usually club discount is on the current selling price.

    let clubPriceNum: number | undefined = undefined
    if (clubDiscountPercentage > 0) {
      clubPriceNum = Math.floor(price * (1 - clubDiscountPercentage / 100))
    }

    return {
      calculated_price_number: price,
      calculated_price: formatAmount(price, currencyCode),
      original_price_number: original,
      original_price: formatAmount(original, currencyCode),
      currency_code: currencyCode,
      price_type: "default",
      percentage_diff: getPercentageDiff(original, price),
      is_discounted: original > price,
      club_price_number: clubPriceNum,
      club_price: clubPriceNum ? formatAmount(clubPriceNum, currencyCode) : undefined,
    }
  }

  // 1. Calculate Cheapest Price (from base product or variants)
  let cheapestPrice: VariantPrice | null = null

  if (product.variants && product.variants.length > 0) {
    // Find lowest variant price
    const minPrice = Math.min(...product.variants.map((v) => v.price))
    cheapestPrice = buildPrice(minPrice)
  } else {
    // Use base product price
    const compareAt = (product.metadata?.compare_at_price as number) || undefined
    cheapestPrice = buildPrice(product.price, compareAt)
  }

  // 2. Calculate Selected Variant Price
  let variantPrice: VariantPrice | null = null
  if (variantId && product.variants) {
    const variant = product.variants.find((v) => v.id === variantId)
    if (variant) {
      variantPrice = buildPrice(variant.price, undefined, variant.compare_at_price)
    }
  }

  return {
    product,
    variantPrice,
    cheapestPrice,
  }
}