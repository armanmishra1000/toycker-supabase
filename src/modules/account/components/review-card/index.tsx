import { Star, Video, Mic } from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ReviewWithMedia } from "@/lib/actions/reviews"
import { cn } from "@lib/util/cn"

type ReviewCardProps = {
    review: ReviewWithMedia
}

const ReviewCard = ({ review }: ReviewCardProps) => {
    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        })
    }

    // Get status badge styling
    const getStatusBadge = (status: string) => {
        const styles = {
            approved: "bg-green-100 text-green-800 border-green-200",
            pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
            rejected: "bg-red-100 text-red-800 border-red-200"
        }
        return styles[status as keyof typeof styles] || styles.pending
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6" data-testid="review-card">
            {/* Header: Product link and Status */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <LocalizedClientLink
                    href={`/products/${review.product_id}`}
                    className="text-base font-semibold text-slate-900 hover:text-slate-700 hover:underline transition-colors"
                    data-testid="review-product-link"
                >
                    {review.product_name}
                </LocalizedClientLink>
                <span
                    className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border self-start",
                        getStatusBadge(review.approval_status)
                    )}
                    data-testid="review-status"
                >
                    {review.approval_status.charAt(0).toUpperCase() + review.approval_status.slice(1)}
                </span>
            </div>

            {/* Rating and Date */}
            <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-0.5" data-testid="review-rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                            key={star}
                            className={`h-4 w-4 ${star <= review.rating ? "text-[#00B37E] fill-[#00B37E]" : "text-gray-300"}`}
                        />
                    ))}
                </div>
                <span className="text-sm text-gray-500" data-testid="review-date">
                    {formatDate(review.created_at)}
                </span>
            </div>

            {/* Review Title */}
            {review.title && (
                <h3 className="text-lg font-semibold text-slate-900 mb-2" data-testid="review-title">
                    {review.title}
                </h3>
            )}

            {/* Review Content */}
            <p className="text-base text-slate-700 mb-4 whitespace-pre-wrap" data-testid="review-content">
                {review.content}
            </p>

            {/* Media Attachments */}
            {review.review_media && review.review_media.length > 0 && (
                <div className="mt-4">
                    <div className="flex flex-wrap gap-2">
                        {review.review_media.map((media) => {
                            let imageUrl = media.file_path
                            if (media.file_type === "image" && !imageUrl.startsWith("http")) {
                                const r2Hostname = process.env.NEXT_PUBLIC_R2_MEDIA_HOSTNAME || "cdn.toycker.in"
                                // Ensure no double slashes
                                const cleanPath = media.file_path.startsWith("/") ? media.file_path.slice(1) : media.file_path
                                imageUrl = `https://${r2Hostname}/${cleanPath}`
                            }

                            return (
                                <div
                                    key={media.id}
                                    className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
                                    data-testid="review-media"
                                >
                                    {media.file_type === "image" && (
                                        <img
                                            src={imageUrl}
                                            alt="Review media"
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                    {media.file_type === "video" && (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Video className="h-8 w-8 text-gray-400" />
                                        </div>
                                    )}
                                    {media.file_type === "audio" && (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Mic className="h-8 w-8 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Anonymous indicator */}
            {review.is_anonymous && (
                <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                    <span>Submitted anonymously</span>
                </div>
            )}
        </div>
    )
}

export default ReviewCard
