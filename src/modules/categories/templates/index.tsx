import { notFound } from "next/navigation"

import { listPaginatedProducts } from "@lib/data/products"
import { retrieveCustomer } from "@lib/data/customer"
import { Category } from "@/lib/supabase/types"
import InteractiveLink from "@modules/common/components/interactive-link"
import { SortOptions, ViewMode } from "@modules/store/components/refinement-list/types"
import ProductGridSection from "@modules/store/components/product-grid-section"
import { StorefrontFiltersProvider } from "@modules/store/context/storefront-filters"
import { STORE_PRODUCT_PAGE_SIZE } from "@modules/store/constants"
import FilterDrawer from "@modules/store/components/filter-drawer"
import Breadcrumbs from "@modules/common/components/breadcrumbs"

export default async function CategoryTemplate({
  category,
  sortBy,
  page,
  countryCode,
  clubDiscountPercentage,
}: {
  category: Category
  sortBy?: SortOptions
  page?: string
  countryCode: string
  clubDiscountPercentage?: number
}) {
  if (!category || !countryCode) notFound()

  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "featured"
  const defaultViewMode: ViewMode = "grid-4"

  const [productListing] = await Promise.all([
    listPaginatedProducts({
      page: pageNumber,
      limit: STORE_PRODUCT_PAGE_SIZE,
      sortBy: sort,
      countryCode,
      queryParams: {
        category_id: [category.id],
      },
    }),
  ])
  const {
    response: { products: initialProducts, count: initialCount },
  } = productListing

  const availabilityOptions = [
    { value: "in_stock", label: "In stock" },
    { value: "out_of_stock", label: "Out of stock" },
  ]

  const parents = [] as Category[]

  const getParents = (category: Category) => {
    if (category.parent_category) {
      parents.push(category.parent_category)
      getParents(category.parent_category)
    }
  }

  getParents(category)

  const breadcrumbTrail = parents.length ? [...parents].reverse() : []
  const breadcrumbItems = [
    { label: "Store", href: "/store" },
    { label: "Categories", href: "/categories" },
    ...breadcrumbTrail.map((parent) => ({ label: parent.name, href: `/categories/${parent.handle}` })),
    { label: category.name },
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
        viewMode: defaultViewMode,
      }}
      initialProducts={initialProducts}
      initialCount={initialCount}
      pageSize={STORE_PRODUCT_PAGE_SIZE}
      fixedCategoryId={category.id}
    >
      <FilterDrawer filterOptions={{ availability: availabilityOptions }}>
        <div className="mx-auto p-4 max-w-[1440px] pb-10" data-testid="category-container">
          <Breadcrumbs items={breadcrumbItems} className="mb-6 hidden small:block" />
          <h1 className="mb-4 text-3xl font-semibold" data-testid="category-page-title">{category.name}</h1>
          {category.description && (
            <div className="mb-8 text-base-regular">
              <p>{category.description}</p>
            </div>
          )}
          {category.category_children && (
            <div className="text-base-large">
              <ul className="grid grid-cols-1 gap-2">
                {category.category_children?.map((c) => (
                  <li key={c.id}>
                    <InteractiveLink href={`/categories/${c.handle}`}>
                      {c.name}
                    </InteractiveLink>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <ProductGridSection
            title={category.name}
            products={initialProducts}
            totalCount={initialCount}
            page={pageNumber}
            viewMode={defaultViewMode}
            sortBy={sort}
            pageSize={STORE_PRODUCT_PAGE_SIZE}
            isCustomerLoggedIn={isCustomerLoggedIn}
            loginPath={accountPath}
            clubDiscountPercentage={clubDiscountPercentage}
          />
        </div>
      </FilterDrawer>
    </StorefrontFiltersProvider>
  )
}