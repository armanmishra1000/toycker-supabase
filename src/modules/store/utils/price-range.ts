import { PriceRangeFilter } from "@modules/store/components/refinement-list/types"

type PriceRangeInput = {
  min?: number
  max?: number
}

const normalizeBound = (value?: number) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return undefined
  }

  return Number.isFinite(value) ? value : undefined
}

export const sanitizePriceRange = (input?: PriceRangeInput): PriceRangeFilter | undefined => {
  if (!input) {
    return undefined
  }

  const min = normalizeBound(input.min)
  const max = normalizeBound(input.max)

  if (min === undefined && max === undefined) {
    return undefined
  }

  if (min !== undefined && max !== undefined && min > max) {
    return { min: max, max: min }
  }

  return { min, max }
}

