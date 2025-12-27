export type VariantPrice = {
  calculated_price: string
  calculated_price_number: number
  original_price: string
  original_price_number: number
  percentage_diff: string
  is_discounted: boolean
}

export type DisplayPrice = {
  current: {
    raw: string
    value: number
  }
  original?: {
    raw: string
    value: number
  }
  percentageText?: string
  isDiscounted: boolean
}

export const buildDisplayPrice = (price?: VariantPrice | null): DisplayPrice | null => {
  if (!price) {
    return null
  }

  const isDiscounted = Boolean(price.is_discounted)

  return {
    current: {
      raw: price.calculated_price,
      value: price.calculated_price_number,
    },
    original: isDiscounted
      ? {
        raw: price.original_price,
        value: price.original_price_number,
      }
      : undefined,
    percentageText: isDiscounted ? `-${price.percentage_diff}%` : undefined,
    isDiscounted,
  }
}
