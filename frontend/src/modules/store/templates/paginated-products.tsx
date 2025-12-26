import { cookies } from "next/headers"

import { listPaginatedProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import {
  AvailabilityFilter,
  PriceRangeFilter,
  SortOptions,
  ViewMode,
} from "@modules/store/components/refinement-list/types"
import ProductGridSection from "@modules/store/components/product-grid-section"
import { STORE_PRODUCT_PAGE_SIZE } from "@modules/store/constants"
import { resolveAgeFilterValue } from "@modules/store/utils/age-filter"
import { resolveCategoryIdentifier } from "@modules/store/utils/category"

type PaginatedProductsParams = {
  limit: number
  collection_id?: string[]
  category_id?: string[]
  id?: string[]
  q?: string
}

type PaginatedProductsProps = {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  countryCode: string
  title?: string
  searchQuery?: string
  totalCountHint?: number
  filters?: {
    availability?: AvailabilityFilter
    price?: PriceRangeFilter
    age?: string
  }
  viewMode?: ViewMode
}

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  productsIds,
  countryCode,
  title = "All products",
  searchQuery,
  totalCountHint,
  filters,
  viewMode,
}: PaginatedProductsProps) {
  const queryParams: PaginatedProductsParams = {
    limit: STORE_PRODUCT_PAGE_SIZE,
  }

  if (collectionId) {
    queryParams["collection_id"] = [collectionId]
  }

  const resolvedCategoryId = await resolveCategoryIdentifier(categoryId)

  if (resolvedCategoryId) {
    queryParams["category_id"] = [resolvedCategoryId]
  }

  if (productsIds) {
    queryParams["id"] = productsIds
  }

  if (searchQuery) {
    queryParams["q"] = searchQuery
  }

  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const normalizedAgeFilter = resolveAgeFilterValue(filters?.age)

  const {
    response: { products, count },
  } = await listPaginatedProducts({
    page,
    limit: STORE_PRODUCT_PAGE_SIZE,
    queryParams,
    sortBy,
    countryCode,
    availability: filters?.availability,
    priceFilter: filters?.price,
    ageFilter: normalizedAgeFilter,
  })

  const totalCount = typeof count === "number" ? count : totalCountHint ?? 0
  const resolvedViewMode = viewMode || "grid-4"
  const resolvedSort = sortBy || "featured"

  const accountPath = "/account"
  const cookieStore = await cookies()
  const isCustomerLoggedIn = Boolean(cookieStore.get("_medusa_jwt"))

  return (
    <ProductGridSection
      title={title}
      products={products}
      totalCount={totalCount}
      page={page}
      viewMode={resolvedViewMode}
      sortBy={resolvedSort}
      pageSize={STORE_PRODUCT_PAGE_SIZE}
      totalCountHint={totalCountHint}
      isCustomerLoggedIn={isCustomerLoggedIn}
      loginPath={accountPath}
    />
  )
}
