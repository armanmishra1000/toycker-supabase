"use client"

import { useState } from "react"
import { approveReview, rejectReview, deleteReview, type ReviewWithMedia } from "@/lib/actions/reviews"
import { Star, Eye, Check, X, Trash2, Video, Mic, Image as ImageIcon } from "lucide-react"
import { ActionButton, IconButton } from "@/modules/admin/components"
import { ProtectedAction } from "@/lib/permissions/components/protected-action"
import { PERMISSIONS } from "@/lib/permissions"
import clsx from "clsx"
import { formatIST } from "@/lib/util/date"
import { AdminTableWrapper } from "@modules/admin/components/admin-table-wrapper"


export default function ReviewsTable({ reviews }: { reviews: ReviewWithMedia[] }) {
    const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved" | "rejected" | "voice">("all")
    const [selectedReview, setSelectedReview] = useState<ReviewWithMedia | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    const filteredReviews = reviews.filter((r) => {
        if (activeTab === "all") return true
        if (activeTab === "voice") return r.review_media?.some((m: any) => m.file_type === 'audio')
        return r.approval_status === activeTab
    })

    // Sort: Pending first for "all" tab, otherwise date desc
    const sortedReviews = [...filteredReviews].sort((a, b) => {
        if (activeTab === "all") {
            if (a.approval_status === "pending" && b.approval_status !== "pending") return -1
            if (a.approval_status !== "pending" && b.approval_status === "pending") return 1
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    const handleAction = async (action: "approve" | "reject" | "delete", id: string) => {
        if (!confirm(`Are you sure you want to ${action} this review ? `)) return

        setIsProcessing(true)
        try {
            if (action === "approve") await approveReview(id)
            if (action === "reject") await rejectReview(id)
            if (action === "delete") await deleteReview(id)
            setSelectedReview(null) // Close modal if open
        } catch (e) {
            alert("Action failed")
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="bg-white rounded-lg shadow border border-gray-200">
            {/* Tabs */}
            <div className="border-b border-gray-200 px-6 flex gap-6">
                {["all", "pending", "approved", "rejected", "voice"].map((tab) => {
                    const count = tab === 'all'
                        ? reviews.length
                        : tab === 'voice'
                            ? reviews.filter(r => r.review_media?.some((m: any) => m.file_type === 'audio')).length
                            : reviews.filter(r => r.approval_status === tab).length

                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={clsx(
                                "py-4 text-sm font-medium border-b-2 transition-colors capitalize flex items-center gap-2",
                                activeTab === tab
                                    ? "border-indigo-600 text-indigo-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            )}
                        >
                            {tab === 'voice' && <Mic className="h-4 w-4" />}
                            {tab}
                            <span className="py-0.5 px-2 rounded-full bg-gray-100 text-xs text-gray-600">
                                {count}
                            </span>
                        </button>
                    )
                })}
            </div>

            {/* Table */}
            <AdminTableWrapper>
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-6 py-3 font-medium">Product / Title</th>
                            <th className="px-6 py-3 font-medium">Reviewer</th>
                            <th className="px-6 py-3 font-medium">Rating</th>
                            <th className="px-6 py-3 font-medium">Status</th>
                            <th className="px-6 py-3 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {sortedReviews.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    No reviews found.
                                </td>
                            </tr>
                        ) : (
                            sortedReviews.map((review) => (
                                <tr key={review.id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-900 line-clamp-1 max-w-xs">{review.product_name}</span>
                                            <span className="text-gray-500 text-xs line-clamp-1">{review.title}</span>
                                            {review.review_media?.length > 0 && (
                                                <div className="flex gap-2 mt-1.5">
                                                    {review.review_media.some((m: any) => m.file_type === 'image') && (
                                                        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                                                            <ImageIcon className="h-3 w-3" />
                                                            {review.review_media.filter((m: any) => m.file_type === 'image').length}
                                                        </span>
                                                    )}
                                                    {review.review_media.some((m: any) => m.file_type === 'video') && (
                                                        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                                                            <Video className="h-3 w-3" />
                                                            {review.review_media.filter((m: any) => m.file_type === 'video').length}
                                                        </span>
                                                    )}
                                                    {review.review_media.some((m: any) => m.file_type === 'audio') && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider border border-indigo-100 shadow-sm">
                                                            <Mic className="h-3 w-3" />
                                                            Voice
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-900 font-medium">
                                                    {review.display_name || "Anonymous"}
                                                </span>
                                                {review.is_anonymous && (
                                                    <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border border-gray-200">
                                                        Anon
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-gray-400">{formatIST(review.created_at)}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-1.5 text-amber-500">
                                                <span className="font-bold text-gray-900">{review.rating.toFixed(1)}</span>
                                                <div className="flex">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={clsx(
                                                                "h-3.5 w-3.5",
                                                                i < review.rating ? "fill-current" : "text-gray-200"
                                                            )}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={clsx(
                                                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                                                {
                                                    "bg-yellow-100 text-yellow-800": review.approval_status === "pending",
                                                    "bg-green-100 text-green-800": review.approval_status === "approved",
                                                    "bg-red-100 text-red-800": review.approval_status === "rejected",
                                                }
                                            )}
                                        >
                                            {review.approval_status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setSelectedReview(review)}
                                                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                                title="View Details"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            {review.approval_status === "pending" && (
                                                <>
                                                    <IconButton
                                                        icon={Check}
                                                        variant="success"
                                                        isLoading={isProcessing}
                                                        tooltip="Approve"
                                                        onClick={() => handleAction("approve", review.id)}
                                                    />
                                                    <IconButton
                                                        icon={X}
                                                        variant="danger"
                                                        isLoading={isProcessing}
                                                        tooltip="Reject"
                                                        onClick={() => handleAction("reject", review.id)}
                                                    />
                                                </>
                                            )}
                                            <ProtectedAction permission={PERMISSIONS.REVIEWS_DELETE} hideWhenDisabled>
                                                <IconButton
                                                    icon={Trash2}
                                                    variant="danger"
                                                    isLoading={isProcessing}
                                                    tooltip="Delete"
                                                    onClick={() => handleAction("delete", review.id)}
                                                />
                                            </ProtectedAction>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </AdminTableWrapper>

            {/* Detail Modal */}
            {selectedReview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                            <h3 className="text-lg font-semibold text-gray-900">Review Details</h3>
                            <button
                                onClick={() => setSelectedReview(null)}
                                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h4 className="font-medium text-gray-900 text-lg">{selectedReview.product_name}</h4>
                                    <p className="text-sm text-gray-500 flex items-center gap-2">
                                        By {selectedReview.display_name || "Anonymous"}
                                        {selectedReview.is_anonymous && (
                                            <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border border-gray-200">
                                                Anon
                                            </span>
                                        )}
                                        • {formatIST(selectedReview.created_at)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full text-amber-700 font-bold">
                                    {selectedReview.rating} <Star className="h-4 w-4 fill-current" />
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                <h5 className="font-semibold text-gray-900 mb-1">{selectedReview.title}</h5>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedReview.content}</p>
                            </div>

                            {selectedReview.review_media && selectedReview.review_media.length > 0 && (
                                <div className="space-y-3">
                                    <h5 className="font-medium text-gray-900 flex items-center gap-2">
                                        Attachments ({selectedReview.review_media.length})
                                    </h5>
                                    <div className="grid grid-cols-2 gap-4">
                                        {selectedReview.review_media.map((media: any) => {
                                            const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ? `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${media.file_path}` : "";
                                            return (
                                                <div key={media.id} className="relative rounded-lg overflow-hidden border border-gray-200 bg-black/5">
                                                    {media.file_type === 'image' && (
                                                        <img src={publicUrl} alt="review media" className="w-full h-auto object-contain max-h-60" />
                                                    )}
                                                    {media.file_type === 'video' && (
                                                        <video controls className="w-full h-auto max-h-60">
                                                            <source src={publicUrl} />
                                                        </video>
                                                    )}
                                                    {media.file_type === 'audio' && (
                                                        <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 space-y-3">
                                                            <div className="flex items-center gap-2 text-indigo-700">
                                                                <Mic className="h-5 w-5" />
                                                                <span className="font-semibold text-sm">Voice Review</span>
                                                            </div>
                                                            <audio controls className="w-full" style={{ height: '40px' }}>
                                                                <source src={publicUrl} />
                                                                Your browser does not support the audio element.
                                                            </audio>
                                                            <p className="text-xs text-gray-500 text-center">
                                                                Listen to the customer's voice review
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div >
                                </div >
                            )}
                        </div >

                        <div className="border-t border-gray-100 px-6 py-4 bg-gray-50 flex justify-end gap-3 shrink-0">
                            {selectedReview.approval_status === "pending" && (
                                <>
                                    <ActionButton
                                        variant="secondary"
                                        isLoading={isProcessing}
                                        loadingText="Processing..."
                                        onClick={() => handleAction("reject", selectedReview.id)}
                                        className="text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200"
                                    >
                                        Reject
                                    </ActionButton>
                                    <ActionButton
                                        variant="success"
                                        isLoading={isProcessing}
                                        loadingText="Processing..."
                                        onClick={() => handleAction("approve", selectedReview.id)}
                                    >
                                        Approve & Publish
                                    </ActionButton>
                                </>
                            )}
                            <ProtectedAction permission={PERMISSIONS.REVIEWS_DELETE} hideWhenDisabled>
                                <ActionButton
                                    variant="secondary"
                                    isLoading={isProcessing}
                                    loadingText="Deleting..."
                                    onClick={() => handleAction("delete", selectedReview.id)}
                                    className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                                >
                                    Delete
                                </ActionButton>
                            </ProtectedAction>
                        </div>
                    </div >
                </div >
            )}
        </div >
    )
}
