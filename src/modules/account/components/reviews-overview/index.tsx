"use client"

import { Button } from "@modules/common/components/button"
import ReviewCard from "../review-card"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ReviewWithMedia } from "@/lib/actions/reviews"

type ReviewsOverviewProps = {
    reviews: ReviewWithMedia[]
}

import { useState } from "react"
import CustomerReviewsModal from "./customer-reviews-modal"

const ReviewsOverview = ({ reviews }: ReviewsOverviewProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const openModal = () => setIsOpen(true)
    const closeModal = () => setIsOpen(false)

    if (reviews?.length) {
        return (
            <div className="w-full">
                <Button onClick={openModal} className="w-full sm:w-auto">
                    View My Purchase Reviews
                </Button>

                <CustomerReviewsModal
                    isOpen={isOpen}
                    close={closeModal}
                    reviews={reviews}
                />
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
