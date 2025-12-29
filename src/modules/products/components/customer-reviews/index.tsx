"use client"

import { useState } from "react"
import { Button } from "@modules/common/components/button"
import Modal from "@modules/common/components/modal"
import { Star, Image as ImageIcon, Video, Mic, Trash2 } from "lucide-react"
import { getPresignedUploadUrl } from "@/lib/actions/storage"
import { submitReview, type ReviewData, type ReviewWithMedia } from "@/lib/actions/reviews"
import Image from "next/image"

const CustomerReviews = ({
  productId,
  reviews = [],
}: {
  productId: string
  reviews?: ReviewWithMedia[]
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [formState, setFormState] = useState({
    review: "",
    title: "",
    displayName: "",
    anonymous: false,
  })
  const [files, setFiles] = useState<File[]>([])
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (rating === 0) {
      alert("Please select a star rating")
      return
    }

    setStatus("submitting")

    try {
      const uploadedMedia: ReviewData["media"] = []

      // 1. Upload files to R2
      for (const file of files) {
        const fileType = file.type.startsWith("image/")
          ? "image"
          : file.type.startsWith("video/")
            ? "video"
            : "audio"

        const { url, key, error } = await getPresignedUploadUrl({
          fileType: file.type,
        })

        if (error || !url || !key) {
          throw new Error("Failed to get upload URL")
        }

        // Upload to R2
        const uploadRes = await fetch(url, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        })

        if (!uploadRes.ok) {
          throw new Error("Failed to upload file to storage")
        }

        uploadedMedia.push({
          file_path: key,
          file_type: fileType as "image" | "video" | "audio",
        })
      }

      // 2. Submit Review Data
      const result = await submitReview({
        product_id: productId,
        rating,
        title: formState.title,
        content: formState.review,
        display_name: formState.displayName,
        is_anonymous: formState.anonymous,
        media: uploadedMedia,
      })

      if (result?.error) {
        throw new Error(result.error)
      }

      setStatus("success")
      setTimeout(() => {
        setIsModalOpen(false)
        setStatus("idle")
        setFormState({ review: "", title: "", displayName: "", anonymous: false })
        setRating(0)
        setFiles([])
      }, 2000)
    } catch (error) {
      console.error(error)
      setStatus("error")
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-xl border border-slate-200 bg-white px-6 py-8 text-center">
        <h3 className="text-2xl font-semibold text-slate-900">Customer Reviews</h3>
        <div className="mt-3 flex items-center justify-center gap-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star key={index} className={`h-5 w-5 ${index < 4 ? "text-[#00B37E] fill-[#00B37E]" : "text-gray-300"}`} />
          ))}
          <span className="ml-2 text-sm text-slate-500">({reviews.length} reviews)</span>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="mt-5 inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-500 hover:bg-slate-50"
        >
          Write A Review
        </button>

        <Modal isOpen={isModalOpen} close={() => setIsModalOpen(false)} size="large">
          <Modal.Title>Write a Review</Modal.Title>
          <Modal.Body>
            {status === "success" ? (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="rounded-full bg-green-100 p-3">
                  <Star className="h-8 w-8 text-green-600 fill-green-600" />
                </div>
                <h3 className="mt-4 text-xl font-medium">Thank you regarding your review!</h3>
                <p className="mt-2 text-center text-gray-500">Your review has been submitted and is pending approval.</p>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="text-sm font-medium text-gray-900">Overall rating</label>
                  <div className="mt-2 flex items-center gap-2">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        className={`transition-colors ${rating > index ? "text-amber-500" : "text-gray-200 hover:text-amber-200"}`}
                        onClick={() => setRating(index + 1)}
                      >
                        <Star className={`h-8 w-8 ${rating > index ? "fill-current" : ""}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <InputControl
                  label="Review Title"
                  value={formState.title}
                  placeholder="Example: Great product!"
                  onChange={(value) => setFormState((prev) => ({ ...prev, title: value }))}
                  required
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">Review</label>
                  <textarea
                    required
                    value={formState.review}
                    placeholder="Tell us what you liked or disliked..."
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, review: event.target.value }))
                    }
                    className="min-h-[100px] w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-900">Add Photos/Videos</span>
                  <div className="flex flex-wrap gap-2">
                    {files.map((file, idx) => (
                      <div key={idx} className="relative h-16 w-16 overflow-hidden rounded-lg border border-gray-200">
                        {file.type.startsWith("image") ? (
                          <img src={URL.createObjectURL(file)} alt="preview" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gray-100">
                            {file.type.startsWith("video") ? <Video className="h-6 w-6 text-gray-400" /> : <Mic className="h-6 w-6 text-gray-400" />}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="absolute right-0 top-0 bg-white/80 p-0.5 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 hover:bg-gray-50">
                      <ImageIcon className="h-5 w-5 text-gray-400" />
                      <span className="text-[10px] text-gray-500">Add</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*,video/*,audio/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                </div>

                <InputControl
                  label="Display Name"
                  value={formState.displayName}
                  onChange={(value) => setFormState((prev) => ({ ...prev, displayName: value }))}
                  required={!formState.anonymous}
                />

                <label className="flex items-center gap-2 text-sm text-gray-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.anonymous}
                    onChange={() => setFormState((prev) => ({ ...prev, anonymous: !prev.anonymous }))}
                    className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                  Keep me anonymous
                </label>

                {status === "error" && (
                  <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
                )}

                <Modal.Footer>
                  <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={status === "submitting"}>
                    {status === "submitting" ? "Submitting..." : "Submit Review"}
                  </Button>
                </Modal.Footer>
              </form>
            )}
          </Modal.Body>
        </Modal>
      </section>

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                  {review.is_anonymous ? "A" : (review.display_name?.[0] || "U")}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{review.is_anonymous ? "Anonymous" : review.display_name}</p>
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < review.rating ? "text-[#00B37E] fill-[#00B37E]" : "text-gray-300"}`} />
                    ))}
                  </div>
                </div>
              </div>
              <span className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString()}</span>
            </div>
            <h4 className="mt-3 font-medium text-gray-900">{review.title}</h4>
            <p className="mt-1 text-sm text-gray-600 leading-relaxed">{review.content}</p>

            {/* Media Grid */}
            {review.review_media && review.review_media.length > 0 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                {review.review_media.map((media: any) => {
                  const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ? `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${media.file_path}` : "";

                  if (media.file_type === 'video') {
                    return (
                      <video key={media.id} controls className="h-32 rounded-lg bg-black">
                        <source src={publicUrl} />
                      </video>
                    )
                  }
                  if (media.file_type === 'audio') {
                    return (
                      <audio key={media.id} controls className="h-12 w-64 mt-2">
                        <source src={publicUrl} />
                      </audio>
                    )
                  }
                  return (
                    <div key={media.id} className="relative h-32 w-32 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg border border-gray-100">
                      <Image
                        src={publicUrl}
                        alt="review media"
                        fill
                        className="object-cover"
                        sizes="128px"
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const InputControl = ({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
  placeholder?: string
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-900">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
      />
    </div>
  )
}

export default CustomerReviews
