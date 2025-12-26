import { cookies } from "next/headers"

import { listCategories } from "@lib/data/categories"
import { listPaginatedProducts } from "@lib/data/products"
import type { HttpTypes } from "@medusajs/types"
import {
  AvailabilityFilter,
  PriceRangeFilter,
  SortOptions,
  ViewMode,
} from "@modules/store/components/refinement-list/types"
import { ageCategories } from "@modules/layout/config/navigation"
import { StorefrontFiltersProvider } from "@modules/store/context/storefront-filters"
import ProductGridSection from "@modules/store/components/product-grid-section"
import { STORE_PRODUCT_PAGE_SIZE } from "@modules/store/constants"
import FilterDrawer from "@modules/store/components/filter-drawer"
import Breadcrumbs from "@modules/common/components/breadcrumbs"
import { resolveAgeFilterValue } from "@modules/store/utils/age-filter"
import { resolveCategoryIdentifier } from "@modules/store/utils/category"
import { resolveCollectionIdentifier } from "@modules/store/utils/collection"

const StoreTemplate = async ({
  sortBy,
  page,
  countryCode,
  searchQuery,
  availability,
  priceRange,
  ageFilter,
  categoryId,
  collectionId,
  viewMode,
}: {
  sortBy?: SortOptions
  page?: string
  countryCode: string
  searchQuery?: string
  availability?: AvailabilityFilter
  priceRange?: PriceRangeFilter
  ageFilter?: string
  categoryId?: string
  collectionId?: string
  viewMode?: ViewMode
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "featured"
  const resolvedViewMode = viewMode || "grid-4"

  const normalizedAgeFilter = resolveAgeFilterValue(ageFilter)
  const resolvedCategoryId = await resolveCategoryIdentifier(categoryId)

  const ageCollectionEntries = await Promise.all(
    ageCategories.map(async (age) => {
      const resolved = await resolveCollectionIdentifier(age.href)
      return [age.id, resolved] as const
    })
  )

  const ageCollectionMap = new Map(
    ageCollectionEntries.filter(([, id]) => Boolean(id)) as [string, string][]
  )

  const providedCollectionId = await resolveCollectionIdentifier(collectionId)
  const inferredAgeCollectionId = ageFilter ? ageCollectionMap.get(ageFilter) : undefined
  const effectiveCollectionId = providedCollectionId ?? inferredAgeCollectionId

  const productQueryParams: HttpTypes.FindParams & HttpTypes.StoreProductListParams = {}

  if (resolvedCategoryId) {
    productQueryParams["category_id"] = [resolvedCategoryId]
  }

  if (effectiveCollectionId) {
    productQueryParams["collection_id"] = [effectiveCollectionId]
  }

  if (searchQuery) {
    productQueryParams["q"] = searchQuery
  }

  const effectiveProductQueryParams: (HttpTypes.FindParams & HttpTypes.StoreProductListParams) | undefined =
    Object.keys(productQueryParams).length ? productQueryParams : undefined

  const [categories, productListing] = await Promise.all([
    listCategories({ limit: 100, include_descendants_tree: true }),
    listPaginatedProducts({
      page: pageNumber,
      limit: STORE_PRODUCT_PAGE_SIZE,
      queryParams: effectiveProductQueryParams,
      sortBy: sort,
      countryCode,
      availability,
      priceFilter: priceRange,
      ageFilter: normalizedAgeFilter,
    }),
  ])

  const {
    response: { products: initialProducts, count: initialCount },
  } = productListing

  const prioritizedCategories = ["Merch", "Pants", "Shirts", "Sweatshirts"]

  const categoryOptions = categories
    ?.filter((category) => {
      if ("is_active" in category) {
        return (category as { is_active?: boolean }).is_active !== false
      }
      return true
    })
    .map((category) => ({ value: category.id, label: category.name }))
    .sort((a, b) => {
      const aIndex = prioritizedCategories.indexOf(a.label)
      const bIndex = prioritizedCategories.indexOf(b.label)

      if (aIndex !== -1 || bIndex !== -1) {
        if (aIndex === -1) return 1
        if (bIndex === -1) return -1
        return aIndex - bIndex
      }

      return a.label.localeCompare(b.label)
    })
    ?? []

  const ageOptions = ageCategories.map((age) => ({
    value: age.id,
    label: age.label,
    collectionId: ageCollectionMap.get(age.id),
  }))

  const availabilityOptions = [
    {
      value: "in_stock" as AvailabilityFilter,
      label: "In stock",
    },
    {
      value: "out_of_stock" as AvailabilityFilter,
      label: "Out of stock",
    },
  ]

  const accountPath = "/account"
  const cookieStore = await cookies()
  const isCustomerLoggedIn = Boolean(cookieStore.get("_medusa_jwt"))

  return (
    <StorefrontFiltersProvider
      countryCode={countryCode}
      initialFilters={{
        sortBy: sort,
        page: pageNumber,
        searchQuery,
        availability,
        priceRange,
        age: ageFilter,
        categoryId: resolvedCategoryId,
        collectionId: effectiveCollectionId,
        viewMode: resolvedViewMode,
      }}
      initialProducts={initialProducts}
      initialCount={initialCount}
      pageSize={STORE_PRODUCT_PAGE_SIZE}
    >
      <FilterDrawer
        searchQuery={searchQuery}
        selectedFilters={{
          availability,
          priceMin: priceRange?.min,
          priceMax: priceRange?.max,
          age: ageFilter,
          category: resolvedCategoryId,
          collection: effectiveCollectionId,
        }}
        filterOptions={{
          availability: availabilityOptions,
          ages: ageOptions,
          categories: categoryOptions,
        }}
      >
        <div className="mx-auto p-4 max-w-[1440px] pb-10" data-testid="category-container" id="store-catalog">
          <Breadcrumbs
            items={[
              {
                label: "Store",
              },
            ]}
            className="mb-6"
          />
          <h1 className="mb-4 text-3xl font-semibold text-slate-900" data-testid="store-page-title">
            All products
          </h1>
          <ProductGridSection
            title="All products"
            products={initialProducts}
            totalCount={initialCount}
            page={pageNumber}
            viewMode={resolvedViewMode}
            sortBy={sort}
            pageSize={STORE_PRODUCT_PAGE_SIZE}
            totalCountHint={initialCount}
            isCustomerLoggedIn={isCustomerLoggedIn}
            loginPath={accountPath}
          />
        </div>
      </FilterDrawer>
    </StorefrontFiltersProvider>
  )
}

export default StoreTemplate
