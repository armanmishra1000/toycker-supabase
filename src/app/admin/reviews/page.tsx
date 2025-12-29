import { getAllReviewsForAdmin } from "@/lib/actions/reviews"
import ReviewsTable from "./reviews-table"

export const metadata = {
    title: "Reviews | Toycker Admin",
    description: "Manage product reviews",
}

export default async function ReviewsPage() {
    const reviews = await getAllReviewsForAdmin()

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-gray-900">Reviews & Ratings</h1>
            </div>
            <ReviewsTable reviews={reviews} />
        </div>
    )
}
