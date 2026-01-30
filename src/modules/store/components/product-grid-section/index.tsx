"use client"

import { useMemo } from "react"

import ProductPreview from "@modules/products/components/product-preview"
import ResultsToolbar from "@modules/store/components/results-toolbar"
import { Pagination } from "@modules/store/components/pagination"
import {
  SortOptions,
  ViewMode,
} from "@modules/store/components/refinement-list/types"
import { useOptionalStorefrontFilters } from "@modules/store/context/storefront-filters"
import { Product } from "@/lib/supabase/types"
import ProductGridSkeleton from "@modules/store/components/product-grid-section/product-grid-skeleton"
import { getGridClassName, getGridItemClassName } from "@modules/store/components/product-grid-section/utils"

type ProductGridSectionProps = {
  title: string
  products: Product[]
  totalCount: number
  page: number
  viewMode: ViewMode
  sortBy: SortOptions
  pageSize: number
  totalCountHint?: number
  isCustomerLoggedIn?: boolean
  loginPath?: string
  clubDiscountPercentage?: number
}

const ProductGridSection = ({
  title,
  products,
  totalCount,
  page,
  viewMode,
  sortBy,
  pageSize,
  totalCountHint,
  isCustomerLoggedIn: _isCustomerLoggedIn = false,
  loginPath: _loginPath = "/account",
  clubDiscountPercentage,
}: ProductGridSectionProps) => {
  const context = useOptionalStorefrontFilters()

  const derived = context
    ? {
      products: context.products,
      totalCount: context.totalCount,
      page: context.filters.page,
      viewMode: context.filters.viewMode,
      sortBy: context.filters.sortBy,
      pageSize: context.pageSize,
      isLoading: context.isFetching,
      isPending: context.isPending,
      error: context.error,
    }
    : {
      products,
      totalCount,
      page,
      viewMode,
      sortBy,
      pageSize,
      isLoading: false,
      isPending: false,
      error: undefined,
    }

  const effectiveCount = typeof derived.totalCount === "number" ? derived.totalCount : totalCountHint ?? 0
  const totalPages = Math.max(1, Math.ceil(effectiveCount / derived.pageSize))
  const hasProducts = derived.products.length > 0
  const gridClassName = getGridClassName(derived.viewMode)
  const itemClassName = getGridItemClassName(derived.viewMode)

  const isLoading = derived.isLoading && context !== null
  const isTransitioning = derived.isPending && context !== null

  const emptyStateHeading = useMemo(() => title || "Products", [title])

  return (
    <section className="space-y-6" data-loading={isLoading ? "true" : undefined} data-pending={isTransitioning ? "true" : undefined}>
      <ResultsToolbar totalCount={effectiveCount} viewMode={derived.viewMode} sortBy={derived.sortBy} />

      {derived.error && (
        <p className="rounded-md border border-red-500 bg-white px-4 py-3 text-sm text-red-600" role="alert">
          {derived.error}
        </p>
      )}

      {isLoading || isTransitioning ? (
        <ProductGridSkeleton viewMode={derived.viewMode} count={derived.pageSize} />
      ) : hasProducts ? (
        <div className="relative">
          {derived.viewMode === "list" ? (
            <div className={gridClassName} data-testid="products-list">
              {derived.products.map((product) => (
                <ProductPreview
                  key={product.id}
                  product={product}
                  viewMode={derived.viewMode}
                  clubDiscountPercentage={clubDiscountPercentage}
                />
              ))}
            </div>
          ) : (
            <ul className={gridClassName} data-testid="products-list">
              {derived.products.map((product) => (
                <li key={product.id} className={itemClassName}>
                  <ProductPreview
                    product={product}
                    viewMode={derived.viewMode}
                    clubDiscountPercentage={clubDiscountPercentage}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <EmptyState heading={emptyStateHeading} />
      )}

      {totalPages > 1 && !derived.error && (
        <Pagination data-testid="product-pagination" page={derived.page} totalPages={totalPages} />
      )}
    </section>
  )
}

const EmptyState = ({ heading }: { heading: string }) => (
  <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center shadow-sm">
    <p className="text-lg font-bold text-slate-900">
      {`We couldn't find any ${heading.toLowerCase()}.`}
    </p>
    <p className="mt-2 text-sm text-gray-500">
      Try adjusting your filters to find what you are looking for.
    </p>
  </div>
)

export default ProductGridSection