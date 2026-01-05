"use client"

import { useState } from "react"
import { Button } from "@modules/common/components/button"
import Modal from "@modules/common/components/modal"
import { Star, Image as ImageIcon, Video, Mic, Trash2 } from "lucide-react"
import { getPresignedUploadUrl } from "@/lib/actions/storage"
import { submitReview, type ReviewData, type ReviewWithMedia } from "@/lib/actions/reviews"
import Image from "next/image"
import { CustomerProfile } from "@/lib/supabase/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const CustomerReviews = ({
  productId,
  reviews = [],
  customer,
}: {
  productId: string
  reviews?: ReviewWithMedia[]
  customer: CustomerProfile | null
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [errorModalOpen, setErrorModalOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
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

  // Simple retry helper
  const uploadWithRetry = async (url: string, file: File, maxRetries: number = 3): Promise<Response> => {
    let lastError: Error | null = null
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        })
        if (response.ok) return response
        // Non-ok response (but not network error), treat as error to potentially retry if transient
        // (Though usually 4xx/5xx from R2 might be persistent, but 5xx warrants retry)
        if (response.status >= 500 || response.status === 429) {
          throw new Error(`Upload failed with status ${response.status} (attempt ${attempt})`)
        }
        return response // Return 4xx so main logic handles it as perm failure
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.warn(`Upload attempt ${attempt} failed:`, lastError)
        if (attempt < maxRetries) {
          // Wait: 1s, 2s, 3s
          await new Promise(resolve => setTimeout(resolve, attempt * 1000))
        }
      }
    }
    throw lastError ?? new Error("Upload failed after retries")
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (rating === 0) {
      setErrorMessage("Please select a star rating")
      setErrorModalOpen(true)
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
          throw new Error(error || "Failed to initialize upload. Please try again.")
        }

        // Upload to R2 with retry
        const uploadRes = await uploadWithRetry(url, file)

        if (!uploadRes.ok) {
          throw new Error(`Failed to upload file. Server returned ${uploadRes.status}`)
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
    } catch (error: any) {
      // Provide user-friendly error if possible
      const msg = error?.message || "Something went wrong. Please try again."
      setErrorMessage(msg)
      setErrorModalOpen(true)
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

        {customer ? (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-5 inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-500 hover:bg-slate-50"
          >
            Write A Review
          </button>
        ) : (
          <LocalizedClientLink
            href={`/login?returnUrl=${encodeURIComponent(`/products/${productId}`)}`}
            className="mt-5 inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Login to Write a Review
          </LocalizedClientLink>
        )}

        <Modal isOpen={isModalOpen} close={() => setIsModalOpen(false)} size="large">
          <Modal.Title>Write a Review</Modal.Title>
          <div className="h-full overflow-y-auto overflow-x-hidden px-1 pb-1">
            <Modal.Body>
              {status === "success" ? (
                <div className="flex flex-col items-center justify-center py-10 w-full">
                  <div className="rounded-full bg-green-100 p-3">
                    <Star className="h-8 w-8 text-green-600 fill-green-600" />
                  </div>
                  <h3 className="mt-4 text-xl font-medium">Thank you regarding your review!</h3>
                  <p className="mt-2 text-center text-gray-500">Your review has been submitted and is pending approval.</p>
                </div>
              ) : (
                <form className="space-y-7 w-full" onSubmit={handleSubmit}>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Overall rating</label>
                    <div className="mt-3 flex items-center gap-2">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <button
                          key={index}
                          type="button"
                          className={`group transition-all duration-200 ease-out ${rating > index ? "text-amber-500" : "text-gray-400 hover:text-amber-400"} hover:scale-110 active:scale-95`}
                          onClick={() => setRating(index + 1)}
                        >
                          <Star className={`h-10 w-10 transition-all duration-200 ${rating > index ? "fill-current" : ""}`} />
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

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700">Review</label>
                    <textarea
                      required
                      value={formState.review}
                      placeholder="Tell us what you liked or disliked..."
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, review: event.target.value }))
                      }
                      className="min-h-[120px] w-full rounded-xl border border-ui-border-base bg-white px-4 py-3 text-ui-fg-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-3">
                    <span className="text-sm font-semibold text-gray-700">Add Photos/Videos</span>
                    <div className="flex flex-wrap gap-3">
                      {files.map((file, idx) => (
                        <div key={idx} className="relative h-20 w-20 overflow-hidden rounded-xl border-2 border-gray-200 shadow-sm">
                          {file.type.startsWith("image") ? (
                            <img src={URL.createObjectURL(file)} alt="preview" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gray-100">
                              {file.type.startsWith("video") ? <Video className="h-7 w-7 text-gray-400" /> : <Mic className="h-7 w-7 text-gray-400" />}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-red-500 shadow-sm transition-all hover:bg-white hover:text-red-600 hover:shadow-md active:scale-95"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 transition-all duration-200 hover:border-primary hover:bg-primary/10 hover:shadow-md active:scale-95">
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                        <span className="mt-1 text-[10px] font-medium text-gray-500">Add</span>
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

                  <div className="pt-2">
                    <label className="flex items-center gap-3 text-sm font-medium text-gray-700 cursor-pointer rounded-xl px-2 py-2.5 -mx-2 transition-colors hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formState.anonymous}
                        onChange={() => setFormState((prev) => ({ ...prev, anonymous: !prev.anonymous }))}
                        className="h-5 w-5 rounded-md border-2 border-gray-300 text-amber-500 transition-all duration-200 focus:border-primary focus:ring-2"
                      />
                      Keep me anonymous
                    </label>
                  </div>

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
          </div>
        </Modal>

        {/* Error Modal */}
        <Modal isOpen={errorModalOpen} close={() => setErrorModalOpen(false)}>
          <Modal.Title>Notice</Modal.Title>
          <Modal.Body>
            <div className="py-4 text-center">
              <p className="text-gray-700">{errorMessage}</p>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={() => setErrorModalOpen(false)} className="w-full">
              OK
            </Button>
          </Modal.Footer>
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
                {review.review_media.map((media) => {
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
  onChange: (_value: string) => void
  type?: string
  required?: boolean
  placeholder?: string
}) => {
  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-ui-border-base bg-white px-4 py-3 text-ui-fg-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
  )
}

export default CustomerReviews
