export type SortOptions =
  | "featured"
  | "best_selling"
  | "alpha_asc"
  | "alpha_desc"
  | "price_asc"
  | "price_desc"
  | "date_old_new"
  | "date_new_old"

export type AvailabilityFilter = "in_stock" | "out_of_stock"

export type PriceRangeFilter = {
  min?: number
  max?: number
}

export type ViewMode = "grid-4" | "grid-5" | "list"

export const PRICE_SLIDER_LIMITS = {
  min: 0,
  max: 2000,
  step: 10,
}
