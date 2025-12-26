import { Metadata } from "next"

import {
  AvailabilityFilter,
  SortOptions,
  ViewMode,
} from "@modules/store/components/refinement-list/types"
import StoreTemplate from "@modules/store/templates"
import { sanitizePriceRange } from "@modules/store/utils/price-range"

export const metadata: Metadata = {
  title: "Store",
  description: "Explore all of our products.",
}

type Params = {
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
    q?: string
    availability?: AvailabilityFilter
    price_min?: string
    price_max?: string
    age?: string
    category?: string
    collection?: string
    view?: ViewMode
  }>
  params: Promise<{
    countryCode: string
  }>
}

export default async function StorePage(props: Params) {
  const params = await props.params
  const searchParams = await props.searchParams
  const { sortBy, page, q, availability, price_min, price_max, age, category, collection, view } = searchParams

  const parsedPriceRange = sanitizePriceRange({
    min: price_min !== undefined ? Number(price_min) : undefined,
    max: price_max !== undefined ? Number(price_max) : undefined,
  })

  return (
    <StoreTemplate
      sortBy={sortBy}
      page={page}
      countryCode={params.countryCode}
      searchQuery={q}
      availability={availability}
      priceRange={parsedPriceRange}
      ageFilter={age}
      categoryId={category}
      collectionId={collection}
      viewMode={view}
    />
  )
}
