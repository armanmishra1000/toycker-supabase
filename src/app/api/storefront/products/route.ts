import { NextResponse } from "next/server"

import { listPaginatedProducts } from "@lib/data/products"
import {
  AvailabilityFilter,
  PriceRangeFilter,
  SortOptions,
} from "@modules/store/components/refinement-list/types"
import { STORE_PRODUCT_PAGE_SIZE } from "@modules/store/constants"
import { sanitizePriceRange } from "@modules/store/utils/price-range"
import { resolveAgeFilterValue } from "@modules/store/utils/age-filter"
import { resolveCategoryIdentifier } from "@modules/store/utils/category"
import { resolveCollectionIdentifier } from "@modules/store/utils/collection"

const normalizeStringArray = (value?: string | string[] | null): string[] => {
  if (!value) {
    return []
  }

  return (Array.isArray(value) ? value : [value]).map((entry) => entry ?? "").filter(Boolean)
}

type RequestBody = {
  countryCode?: string
  page?: number
  limit?: number
  sortBy?: SortOptions
  categoryId?: string
  collectionId?: string | string[]
  productsIds?: string[]
  searchQuery?: string
  filters?: {
    availability?: AvailabilityFilter
    price?: PriceRangeFilter
    age?: string
  }
}

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody

    if (!body.countryCode) {
      return NextResponse.json({ message: "Country code is required" }, { status: 400 })
    }

    const page = typeof body.page === "number" && body.page > 0 ? Math.floor(body.page) : 1
    const limit =
      typeof body.limit === "number" && body.limit > 0 ? Math.floor(body.limit) : STORE_PRODUCT_PAGE_SIZE
    const sortBy: SortOptions = body.sortBy || "featured"

    const queryParams: Record<string, unknown> = {}
    const resolvedCategoryId = await resolveCategoryIdentifier(body.categoryId)

    if (resolvedCategoryId) {
      queryParams["category_id"] = [resolvedCategoryId]
    }

    const collectionIdsInput = normalizeStringArray(body.collectionId)
    if (collectionIdsInput.length) {
      const resolvedCollectionIds = await Promise.all(
        collectionIdsInput.map(async (entry) => (await resolveCollectionIdentifier(entry)) ?? undefined)
      )
      const validCollectionIds = resolvedCollectionIds.filter((id): id is string => Boolean(id))
      if (validCollectionIds.length) {
        queryParams["collection_id"] = validCollectionIds
      }
    }

    if (body.productsIds?.length) {
      queryParams["id"] = body.productsIds
    }

    if (body.searchQuery) {
      queryParams["q"] = body.searchQuery
    }

    const requestedPrice = sanitizePriceRange(body.filters?.price)
    const normalizedAgeFilter = resolveAgeFilterValue(body.filters?.age)

    const { response } = await listPaginatedProducts({
      page,
      limit,
      sortBy,
      countryCode: body.countryCode,
      queryParams,
      availability: body.filters?.availability,
      priceFilter: requestedPrice,
      ageFilter: normalizedAgeFilter,
    })

    return NextResponse.json({ products: response.products, count: response.count })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load products"
    return NextResponse.json({ message }, { status: 500 })
  }
}
