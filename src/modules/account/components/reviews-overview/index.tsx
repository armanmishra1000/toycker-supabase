import { Button } from "@modules/common/components/button"
import ReviewCard from "../review-card"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ReviewWithMedia } from "@/lib/actions/reviews"

type ReviewsOverviewProps = {
    reviews: ReviewWithMedia[]
}

const ReviewsOverview = ({ reviews }: ReviewsOverviewProps) => {
    if (reviews?.length) {
        return (
            <div className="flex flex-col gap-y-6 w-full">
                {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                ))}
            </div>
        )
    }

    return (
        <div
            className="w-full flex flex-col items-center gap-y-4 text-center py-12"
            data-testid="no-reviews-container"
        >
            <h2 className="text-large-semi">No reviews yet</h2>
            <p className="text-base-regular max-w-md">
                You haven&apos;t submitted any product reviews yet. Start sharing your thoughts on products you&apos;ve purchased!
            </p>
            <div className="mt-4">
                <LocalizedClientLink href="/" passHref>
                    <Button data-testid="browse-products-button">
                        Browse Products
                    </Button>
                </LocalizedClientLink>
            </div>
        </div>
    )
}

export default ReviewsOverview
