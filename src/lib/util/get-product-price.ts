import { Product } from "@/lib/supabase/types"
import { VariantPrice } from "@/types/global"

type GetProductPriceArgs = {
  product: Product
  variantId?: string
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
}: GetProductPriceArgs): ProductPriceResult => {
  if (!product) {
    throw new Error("No product provided")
  }

  const currencyCode = product.currency_code || "INR"

  // Helper to build price object
  const buildPrice = (price: number, originalPrice?: number): VariantPrice => {
    const original = originalPrice || price
    return {
      calculated_price_number: price,
      calculated_price: formatAmount(price, currencyCode),
      original_price_number: original,
      original_price: formatAmount(original, currencyCode),
      currency_code: currencyCode,
      price_type: "default",
      percentage_diff: getPercentageDiff(original, price),
      is_discounted: original > price,
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
      variantPrice = buildPrice(variant.price)
    }
  }

  return {
    product,
    variantPrice,
    cheapestPrice,
  }
}