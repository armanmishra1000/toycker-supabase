"use client"

import FilterRadioGroup from "@modules/common/components/filter-radio-group"
import { SortOptions } from "../types"

type SortProductsProps = {
  sortBy: SortOptions
  setQueryParams: (name: string, value: SortOptions) => void
  "data-testid"?: string
}

export const SORT_OPTIONS: { value: SortOptions; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "best_selling", label: "Best selling" },
  { value: "alpha_asc", label: "Alphabetically A–Z" },
  { value: "alpha_desc", label: "Alphabetically Z–A" },
  { value: "price_asc", label: "Price low to high" },
  { value: "price_desc", label: "Price high to low" },
  { value: "date_old_new", label: "Date old to new" },
  { value: "date_new_old", label: "Date new to old" },
]

const SortProducts = ({
  "data-testid": dataTestId,
  sortBy,
  setQueryParams,
}: SortProductsProps) => {
  const handleChange = (value: SortOptions) => {
    setQueryParams("sortBy", value)
  }

  return (
    <FilterRadioGroup
      title="Sort by"
      items={SORT_OPTIONS}
      value={sortBy}
      handleChange={handleChange}
      data-testid={dataTestId}
    />
  )
}

export default SortProducts
