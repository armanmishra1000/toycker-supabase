import { getAllReviewsForAdmin } from "@/lib/actions/reviews"
import { AdminPagination } from "@modules/admin/components/admin-pagination"
import { AdminSearchInput } from "@modules/admin/components/admin-search-input"
import ReviewsTable from "./reviews-table"
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline"

export const metadata = {
    title: "Reviews | Toycker Admin",
    description: "Manage product reviews",
}

export default async function ReviewsPage({
    searchParams
}: {
    searchParams: Promise<{ page?: string; search?: string }>
}) {
    const { page = "1", search = "" } = await searchParams
    const pageNumber = parseInt(page, 10) || 1

    const { reviews, count, totalPages, currentPage } = await getAllReviewsForAdmin({
        page: pageNumber,
        limit: 20,
        search: search || undefined
    })

    const hasSearch = search && search.trim().length > 0
    const buildUrl = (newPage?: number, clearSearch = false) => {
        const params = new URLSearchParams()
        if (newPage && newPage > 1) {
            params.set("page", newPage.toString())
        }
        if (!clearSearch && hasSearch) {
            params.set("search", search)
        }
        const queryString = params.toString()
        return queryString ? `/admin/reviews?${queryString}` : "/admin/reviews"
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-gray-900">Reviews & Ratings</h1>
            </div>

            {/* Search Bar */}
            <AdminSearchInput defaultValue={search} basePath="/admin/reviews" placeholder="Search reviews by title, content, or reviewer..." />

            {/* Results Count */}
            <div className="text-sm text-gray-500">
                Showing {count > 0 ? ((currentPage - 1) * 20) + 1 : 0} to {Math.min(currentPage * 20, count)} of {count} reviews
            </div>

            {reviews.length > 0 ? (
                <>
                    <ReviewsTable reviews={reviews} />

                    {/* Pagination */}
                    <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                        <AdminPagination currentPage={currentPage} totalPages={totalPages} />
                    </div>
                </>
            ) : (
                <div className="bg-white rounded-lg shadow border border-gray-200 p-20 text-center">
                    <div className="flex flex-col items-center">
                        <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-200 mb-3" />
                        <p className="text-sm font-bold text-gray-900">No reviews found</p>
                        {hasSearch ? (
                            <p className="text-xs text-gray-400 mt-1">
                                Try adjusting your search or{" "}
                                <a href={buildUrl()} className="text-indigo-600 hover:underline">
                                    clear the search
                                </a>
                            </p>
                        ) : (
                            <p className="text-xs text-gray-400 mt-1">No reviews yet.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
