"use client"

import { cn } from "@lib/util/cn"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { useOptionalStorefrontFilters } from "@modules/store/context/storefront-filters"

export function Pagination({
  page,
  totalPages,
  'data-testid': dataTestid
}: {
  page: number
  totalPages: number
  'data-testid'?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const storefrontFilters = useOptionalStorefrontFilters()

  const currentPage = storefrontFilters ? storefrontFilters.filters.page : page
  const pagesCount = storefrontFilters ? storefrontFilters.totalPages : totalPages

  // Helper function to generate an array of numbers within a range
  const arrayRange = (start: number, stop: number) =>
    Array.from({ length: stop - start + 1 }, (_, index) => start + index)

  // Function to handle page changes
  const handlePageChange = (newPage: number) => {
    if (storefrontFilters) {
      storefrontFilters.setPage(newPage)
      return
    }
    const params = new URLSearchParams(searchParams)
    params.set("page", newPage.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  // Function to render a page button
  const renderPageButton = (
    p: number,
    label: string | number,
    isCurrent: boolean
  ) => (
    <button
      key={p}
      className={cn(
        "h-10 min-w-[2.5rem] rounded-full px-3 text-sm font-semibold transition",
        isCurrent
          ? "bg-gray-900 text-white shadow-sm"
          : "bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900"
      )}
      disabled={isCurrent}
      aria-current={isCurrent ? "page" : undefined}
      onClick={() => handlePageChange(p)}
    >
      {label}
    </button>
  )

  // Function to render ellipsis
  const renderEllipsis = (key: string) => (
    <span
      key={key}
      className="px-2 text-base font-semibold text-gray-500"
    >
      …
    </span>
  )

  // Function to render page buttons based on the current page and total pages
  const renderPageButtons = () => {
    const buttons = []

    if (pagesCount <= 7) {
      // Show all pages
      buttons.push(
        ...arrayRange(1, pagesCount).map((p) =>
          renderPageButton(p, p, p === currentPage)
        )
      )
    } else {
      // Handle different cases for displaying pages and ellipses
      if (currentPage <= 4) {
        // Show 1, 2, 3, ..., lastpage
        buttons.push(
          ...arrayRange(1, 3).map((p) => renderPageButton(p, p, p === currentPage))
        )
        buttons.push(renderEllipsis("ellipsis1"))
        buttons.push(
          renderPageButton(pagesCount, pagesCount, pagesCount === currentPage)
        )
      } else if (currentPage >= pagesCount - 3) {
        // Show 1, ..., lastpage - 4, lastpage - 3, lastpage - 2, lastpage - 1, lastpage
        buttons.push(renderPageButton(1, 1, 1 === currentPage))
        buttons.push(renderEllipsis("ellipsis2"))
        buttons.push(
          ...arrayRange(pagesCount - 4, pagesCount).map((p) =>
            renderPageButton(p, p, p === currentPage)
          )
        )
      } else {
        // Show 1, ..., page - 1, page, page + 1, ..., lastpage
        buttons.push(renderPageButton(1, 1, 1 === currentPage))
        buttons.push(renderEllipsis("ellipsis3"))
        buttons.push(
          ...arrayRange(currentPage - 1, currentPage + 1).map((p) =>
            renderPageButton(p, p, p === currentPage)
          )
        )
        buttons.push(renderEllipsis("ellipsis4"))
        buttons.push(
          renderPageButton(pagesCount, pagesCount, pagesCount === currentPage)
        )
      }
    }

    return buttons
  }

  // Render the component
  const isFirstPage = currentPage <= 1
  const isLastPage = currentPage >= pagesCount

  const goToPrevious = () => {
    if (!isFirstPage) {
      handlePageChange(currentPage - 1)
    }
  }

  const goToNext = () => {
    if (!isLastPage) {
      handlePageChange(currentPage + 1)
    }
  }

  return (
    <div className="mt-12 flex w-full flex-col items-center gap-3" data-testid={dataTestid}>
      <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1 shadow-sm">
        <button
          type="button"
          onClick={goToPrevious}
          disabled={isFirstPage}
          className="h-9 rounded-full px-4 text-sm font-semibold text-gray-900 transition disabled:opacity-40"
        >
          Prev
        </button>
        <div className="flex items-center gap-1">{renderPageButtons()}</div>
        <button
          type="button"
          onClick={goToNext}
          disabled={isLastPage}
          className="h-9 rounded-full px-4 text-sm font-semibold text-gray-900 transition disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  )
}
