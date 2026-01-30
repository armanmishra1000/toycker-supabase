"use client"

import { cn } from "@lib/util/cn"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { useOptionalStorefrontFilters } from "@modules/store/context/storefront-filters"
import { useCatalogLoading } from "@modules/common/context/catalog-loading-context"

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
  const catalogLoading = useCatalogLoading()
  const [isPending, startTransition] = useTransition()

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

    if (catalogLoading) {
      catalogLoading.setIsFetching(true)
      catalogLoading.startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
      })
      return
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  // Function to render a page button
  const renderPageButton = (
    p: number,
    label: string | number,
    isCurrent: boolean
  ) => (
    <button
      key={p}
      onClick={() => handlePageChange(p)}
      aria-label={`Goto page ${p}`}
      aria-current={isCurrent ? "page" : undefined}
      className={cn(
        "h-9 w-9 md:h-10 md:w-10 flex flex-shrink-0 items-center justify-center rounded-xl text-xs md:text-sm font-bold transition-all duration-300 ease-in-out",
        isCurrent
          ? "bg-[#ed1c24] text-white shadow-md scale-105"
          : "bg-transparent text-gray-600 hover:bg-gray-50 hover:text-[#ed1c24]"
      )}
    >
      {label}
    </button>
  )

  const renderEllipsis = (key: string) => (
    <span
      key={key}
      className="flex h-9 w-9 md:h-10 md:w-10 flex-shrink-0 items-center justify-center text-xs md:text-sm font-bold text-gray-400"
    >
      &hellip;
    </span>
  )

  const renderPageButtons = () => {
    const pages: (number | string)[] = []
    const siblingCount = 1

    if (pagesCount <= 7) {
      pages.push(...arrayRange(1, pagesCount))
    } else {
      const leftSiblingIndex = Math.max(currentPage - siblingCount, 1)
      const rightSiblingIndex = Math.min(currentPage + siblingCount, pagesCount)

      const shouldShowLeftDots = leftSiblingIndex > 2
      const shouldShowRightDots = rightSiblingIndex < pagesCount - 1

      if (!shouldShowLeftDots && shouldShowRightDots) {
        const leftItemCount = 3 + 2 * siblingCount
        pages.push(...arrayRange(1, leftItemCount), "DOTS-RIGHT", pagesCount)
      } else if (shouldShowLeftDots && !shouldShowRightDots) {
        const rightItemCount = 3 + 2 * siblingCount
        pages.push(1, "DOTS-LEFT", ...arrayRange(pagesCount - rightItemCount + 1, pagesCount))
      } else {
        pages.push(1, "DOTS-LEFT", ...arrayRange(leftSiblingIndex, rightSiblingIndex), "DOTS-RIGHT", pagesCount)
      }
    }

    return pages.map((page, index) => {
      if (page === "DOTS-LEFT") return renderEllipsis("dots-left")
      if (page === "DOTS-RIGHT") return renderEllipsis("dots-right")
      return renderPageButton(page as number, page as number, page === currentPage)
    })
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
    <nav className="mt-12 flex w-full flex-col items-center" aria-label="Pagination Navigation" data-testid={dataTestid}>
      <div className="flex items-center rounded-2xl border border-gray-100 bg-white p-1 shadow-sm md:p-1.5 transition-all duration-500 ease-in-out">
        <button
          type="button"
          onClick={goToPrevious}
          disabled={isFirstPage}
          aria-label="Previous Page"
          className="flex h-9 w-9 md:h-10 md:w-20 items-center justify-center gap-1 text-sm font-bold text-gray-400 hover:text-[#ed1c24] transition-all duration-300 ease-in-out disabled:opacity-20 disabled:hover:text-gray-400 group"
        >
          <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
          <span className="hidden md:block">Prev</span>
        </button>
        <div className="flex items-center gap-1 md:gap-2 px-1">{renderPageButtons()}</div>
        <button
          type="button"
          onClick={goToNext}
          disabled={isLastPage}
          aria-label="Next Page"
          className="flex h-9 w-9 md:h-10 md:w-20 items-center justify-center gap-1 text-sm font-bold text-gray-800 hover:text-[#ed1c24] transition-all duration-300 ease-in-out disabled:opacity-20 group"
        >
          <span className="hidden md:block">Next</span>
          <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
        </button>
      </div>
    </nav>
  )
}
