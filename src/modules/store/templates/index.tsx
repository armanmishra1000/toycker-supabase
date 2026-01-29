import { listPaginatedProducts } from "@lib/data/products"
import { retrieveCustomer } from "@lib/data/customer"
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
import { resolveCollectionIdentifier } from "@modules/store/utils/collection"

const StoreTemplate = async ({
  sortBy,
  page,
  countryCode,
  searchQuery,
  availability,
  priceRange,
  ageFilter,
  collectionId,
  viewMode,
  clubDiscountPercentage,
}: {
  sortBy?: SortOptions
  page?: string
  countryCode: string
  searchQuery?: string
  availability?: AvailabilityFilter
  priceRange?: PriceRangeFilter
  ageFilter?: string
  collectionId?: string
  viewMode?: ViewMode
  clubDiscountPercentage?: number
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "featured"
  const resolvedViewMode = viewMode || "grid-4"

  const normalizedAgeFilter = resolveAgeFilterValue(ageFilter)

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

  const productQueryParams: Record<string, string | string[] | undefined> = {}

  if (effectiveCollectionId) {
    productQueryParams["collection_id"] = [effectiveCollectionId]
  }

  if (searchQuery) {
    productQueryParams["q"] = searchQuery
  }

  const effectiveProductQueryParams: Record<string, string | string[] | undefined> | undefined =
    Object.keys(productQueryParams).length ? productQueryParams : undefined

  const productListing = await listPaginatedProducts({
    page: pageNumber,
    limit: STORE_PRODUCT_PAGE_SIZE,
    queryParams: effectiveProductQueryParams,
    sortBy: sort,
    countryCode,
    availability,
    priceFilter: priceRange,
    ageFilter: normalizedAgeFilter,
  })

  const {
    response: { products: initialProducts, count: initialCount },
  } = productListing

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
  const customer = await retrieveCustomer()
  const isCustomerLoggedIn = !!customer

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
          collection: effectiveCollectionId,
        }}
        filterOptions={{
          availability: availabilityOptions,
          ages: ageOptions,
        }}
      >
        <div className="mx-auto p-4 max-w-[1440px] pb-10" data-testid="category-container" id="store-catalog">
          <Breadcrumbs
            items={[
              {
                label: "Store",
              },
            ]}
            className="mb-6 hidden small:block"
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
            clubDiscountPercentage={clubDiscountPercentage}
          />
        </div>
      </FilterDrawer>
    </StorefrontFiltersProvider>
  )
}

export default StoreTemplate