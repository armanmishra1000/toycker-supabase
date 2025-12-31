"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@lib/util/cn"

interface AdminPaginationProps {
  currentPage: number
  totalPages: number
}

export function AdminPagination({ currentPage, totalPages }: AdminPaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", newPage.toString())
    router.push(`?${params.toString()}`)
  }

  const isFirstPage = currentPage <= 1
  const isLastPage = currentPage >= totalPages

  if (totalPages <= 1) {
    return null
  }

  return (
    <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
      <div className="text-sm text-gray-500">
        Page <span className="font-medium text-gray-900">{currentPage}</span> of{" "}
        <span className="font-medium text-gray-900">{totalPages}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={isFirstPage}
          className={cn(
            "px-3 py-2 text-sm font-medium rounded-lg transition-colors",
            isFirstPage
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-700 hover:bg-gray-100"
          )}
        >
          Previous
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number

            if (totalPages <= 5) {
              pageNum = i + 1
            } else if (currentPage <= 3) {
              pageNum = i < 4 ? i + 1 : totalPages
            } else if (currentPage >= totalPages - 2) {
              pageNum = i === 0 ? 1 : totalPages - 4 + i
            } else {
              pageNum = i === 0 ? 1 : i === 4 ? totalPages : currentPage - 2 + i
            }

            const isCurrent = pageNum === currentPage

            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => handlePageChange(pageNum)}
                disabled={isCurrent}
                className={cn(
                  "min-w-[2rem] h-9 px-3 text-sm font-medium rounded-lg transition-colors",
                  isCurrent
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                {pageNum}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={isLastPage}
          className={cn(
            "px-3 py-2 text-sm font-medium rounded-lg transition-colors",
            isLastPage
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-700 hover:bg-gray-100"
          )}
        >
          Next
        </button>
      </div>
    </div>
  )
}
