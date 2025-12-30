import { Metadata } from "next"
import { notFound } from "next/navigation"
import { retrieveCustomer } from "@lib/data/customer"
import { getUserReviews } from "@lib/actions/reviews"
import ReviewsOverview from "@modules/account/components/reviews-overview"

export const metadata: Metadata = {
    title: "Customer Reviews",
    description: "View your submitted product reviews",
}

export default async function Reviews() {
    const customer = await retrieveCustomer()
    const reviews = await getUserReviews()

    if (!customer) {
        notFound()
    }

    return (
        <div className="w-full" data-testid="reviews-page-wrapper">
            <div className="mb-8 flex flex-col gap-y-4">
                <h1 className="text-2xl-semi">Customer Reviews</h1>
                <p className="text-base-regular">
                    View all the reviews you have submitted on products.
                </p>
            </div>
            <ReviewsOverview reviews={reviews} />
        </div>
    )
}
