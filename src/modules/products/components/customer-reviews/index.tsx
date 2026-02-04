"use client"

import { useState, useMemo } from "react"
import { Button } from "@modules/common/components/button"
import Modal from "@modules/common/components/modal"
import { Star, Image as ImageIcon, Video, Mic, Trash2, Play, Pause, Square, ShieldCheck, User, X } from "lucide-react"
import { getPresignedUploadUrl } from "@/lib/actions/storage"
import { submitReview, type ReviewData, type ReviewWithMedia } from "@/lib/actions/reviews"
import Image from "next/image"
import { CustomerProfile } from "@/lib/supabase/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { cn } from "@lib/util/cn"
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder"
import SideDrawer from "@modules/common/components/side-drawer"

const CustomerReviews = ({
  productId,
  reviews = [],
  customer,
  productThumbnail,
}: {
  productId: string
  reviews?: ReviewWithMedia[]
  customer: CustomerProfile | null
  productThumbnail?: string | null
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

  // Voice recording hook
  const voiceRecorder = useVoiceRecorder()

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

      // 1. Upload files (including voice recording) to R2
      const allFiles = [...files]

      // Add voice recording if exists
      if (voiceRecorder.audioBlob) {
        const voiceFile = new File(
          [voiceRecorder.audioBlob],
          `voice-review-${Date.now()}.${voiceRecorder.audioBlob.type.includes('mp4') ? 'mp4' : 'webm'}`,
          { type: voiceRecorder.audioBlob.type }
        )
        allFiles.push(voiceFile)
      }

      for (const file of allFiles) {
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
        voiceRecorder.resetRecording()
      }, 2000)
    } catch (error: any) {
      // Provide user-friendly error if possible
      const msg = error?.message || "Something went wrong. Please try again."
      setErrorMessage(msg)
      setErrorModalOpen(true)
    }
  }

  const { averageRating, totalRatings, distribution } = useMemo(() => {
    const total = reviews.length
    const dist = [0, 0, 0, 0, 0] // 5, 4, 3, 2, 1
    let sum = 0

    reviews.forEach((r) => {
      const starIndex = 5 - Math.round(r.rating)
      if (starIndex >= 0 && starIndex < 5) {
        dist[starIndex]++
      }
      sum += r.rating
    })

    return {
      averageRating: total > 0 ? (sum / total).toFixed(1) : "0.0",
      totalRatings: total,
      distribution: dist.map((count) => ({
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
    }
  }, [reviews])

  const [activeVideo, setActiveVideo] = useState<{ url: string, quote?: string, author: string } | null>(null)
  const [displayCount, setDisplayCount] = useState(3)
  const visibleReviews = reviews.slice(0, displayCount)


  return (
    <div className="flex flex-col gap-12">
      {/* 1. Summary Header Section */}
      <section className="border border-gray-200 rounded-2xl overflow-hidden transition-all duration-300 p-6">
        <div className="flex flex-col md:flex-row gap-10 items-center md:items-start">
          {/* Left Side: Average Score */}
          <div className="flex flex-col items-center md:items-start md:border-r md:border-gray-100 md:pr-10 md:min-w-[180px]">
            <h2 className="text-5xl font-bold text-gray-900 leading-none tracking-tighter">{averageRating}</h2>
            <div className="mt-4 flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-5 w-5 transition-colors",
                    i < Math.round(Number(averageRating))
                      ? "text-indigo-500 fill-indigo-500"
                      : "text-gray-200"
                  )}
                />
              ))}
            </div>
            <p className="mt-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              {totalRatings.toLocaleString()} ratings
            </p>

            {customer ? (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="mt-6 flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3.5 text-xs font-bold text-white transition-all hover:bg-gray-800"
              >
                Write A Review
              </button>
            ) : (
              <LocalizedClientLink
                href={`/login?returnUrl=${encodeURIComponent(`/products/${productId}`)}`}
                className="mt-6 flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3.5 text-xs font-bold text-white transition-all hover:bg-gray-800"
              >
                Login to Write a Review
              </LocalizedClientLink>
            )}
          </div>

          {/* Right Side: Distribution Bars */}
          <div className="flex-1 w-full max-w-xl space-y-3">
            {distribution.map((item, index) => {
              const label = (5 - index).toFixed(1)
              return (
                <div key={index} className="flex items-center gap-4 group">
                  <span className="text-xs font-bold text-gray-400 min-w-[28px] group-hover:text-indigo-500 transition-colors">{label}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner relative">
                    <div
                      className="absolute inset-y-0 left-0 bg-indigo-500 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] rounded-full shadow-[0_0_8px_rgba(99,102,241,0.2)]"
                      style={{ width: `${item.percentage}%` }}
                      role="progressbar"
                      aria-valuenow={item.percentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                  <div className="min-w-[80px] text-right">
                    <span className="text-[10px] text-gray-500 font-bold tracking-tight">
                      {item.count >= 1000 ? `${(item.count / 1000).toFixed(1)}K` : item.count} reviews
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 2. Write Review Side Drawer */}
      <SideDrawer
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Write a Review"
        size="medium"
      >
        {status === "success" ? (
          <div className="flex h-full flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-50 text-green-500 shadow-inner">
              <ShieldCheck className="h-12 w-12" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Review Submitted!</h3>
            <p className="text-slate-500 max-w-[280px] font-medium leading-relaxed">
              Thank you for sharing your experience. Your review is being processed.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <div className="space-y-4">
              <span className="text-sm font-bold text-gray-900 uppercase tracking-widest pl-1">Overall Rating</span>
              <div className="flex items-center gap-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 w-fit">
                {Array.from({ length: 5 }).map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setRating(index + 1)}
                    className="transition-all hover:scale-125 active:scale-95"
                  >
                    <Star
                      className={cn(
                        "h-8 w-8 transition-colors",
                        index < rating ? "fill-indigo-500 text-indigo-500" : "text-gray-300"
                      )}
                    />
                  </button>
                ))}
                <span className="ml-2 text-lg font-black text-indigo-600">{rating > 0 ? rating.toFixed(1) : ""}</span>
              </div>
            </div>

            <InputControl
              label="Review Title"
              value={formState.title}
              placeholder="Summarize your experience"
              onChange={(value) => setFormState((prev) => ({ ...prev, title: value }))}
              required
            />

            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-900 uppercase tracking-widest pl-1">Detailed Review</label>
              <textarea
                required
                value={formState.review}
                placeholder="What did you think about the product?"
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, review: event.target.value }))
                }
                className="min-h-[160px] w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 placeholder:text-gray-400"
              />
            </div>

            {/* Media Upload Section */}
            <div className="space-y-4">
              <span className="text-sm font-bold text-gray-900 uppercase tracking-widest pl-1">Photos & Videos</span>
              <div className="flex flex-wrap gap-4">
                {files.map((file, idx) => (
                  <div key={idx} className="relative h-24 w-24 overflow-hidden rounded-2xl border-2 border-white shadow-md ring-1 ring-gray-100">
                    {file.type.startsWith("image") ? (
                      <Image
                        src={URL.createObjectURL(file)}
                        alt="preview"
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-50">
                        {file.type.startsWith("video") ? <Video className="h-8 w-8 text-gray-400" /> : <Mic className="h-8 w-8 text-gray-400" />}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="absolute right-1.5 top-1.5 rounded-full bg-white/90 p-1.5 text-red-500 shadow-sm transition-all hover:bg-white hover:text-red-600 active:scale-95"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 transition-all hover:border-indigo-50 hover:bg-indigo-50 hover:shadow-lg active:scale-95 group">
                  <ImageIcon className="h-8 w-8 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                  <span className="mt-2 text-[11px] font-bold text-gray-400 group-hover:text-indigo-500 uppercase">Add Media</span>
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

            {/* Voice Recording Section */}
            <div className="space-y-4 pt-2">
              <span className="text-sm font-bold text-gray-900 uppercase tracking-widest pl-1">Voice Review (Optional)</span>

              {voiceRecorder.status === 'error' && (
                <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-700 font-medium">
                  {voiceRecorder.errorMessage}
                </div>
              )}

              {(voiceRecorder.status === 'idle' || voiceRecorder.status === 'error') && !voiceRecorder.audioBlob && (
                <button
                  type="button"
                  onClick={voiceRecorder.startRecording}
                  className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-4 text-gray-500 transition-all hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-600 active:scale-95 w-full sm:w-auto"
                >
                  <Mic className="h-5 w-5" />
                  <span className="text-sm font-bold uppercase tracking-wider">Start Recording</span>
                </button>
              )}

              {(voiceRecorder.status === 'recording' || voiceRecorder.status === 'paused') && (
                <div className="rounded-[2rem] border-2 border-red-100 bg-red-50 px-6 py-6 space-y-4 shadow-sm animate-in fade-in zoom-in duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {voiceRecorder.status === 'recording' && (
                        <div className="h-3 w-3 rounded-full bg-red-500 animate-ping" />
                      )}
                      <span className="text-sm font-bold text-red-900 uppercase tracking-widest">
                        {voiceRecorder.status === 'recording' ? 'Recording Live' : 'Paused'}
                      </span>
                    </div>
                    <span className="text-lg font-mono font-bold text-red-600">
                      {Math.floor(voiceRecorder.duration / 60).toString().padStart(2, '0')}:
                      {(voiceRecorder.duration % 60).toString().padStart(2, '0')}
                    </span>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={voiceRecorder.status === 'recording' ? voiceRecorder.pauseRecording : voiceRecorder.resumeRecording}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white border border-red-100 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 active:scale-95 shadow-sm"
                    >
                      {voiceRecorder.status === 'recording' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      {voiceRecorder.status === 'recording' ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      type="button"
                      onClick={voiceRecorder.stopRecording}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 active:scale-95 shadow-lg shadow-red-200"
                    >
                      <Square className="h-4 w-4" />
                      Stop
                    </button>
                  </div>
                </div>
              )}

              {voiceRecorder.status === 'stopped' && voiceRecorder.audioUrl && (
                <div className="rounded-[2rem] border-2 border-indigo-100 bg-indigo-50/50 p-6 space-y-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-200">
                      <Mic className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900 uppercase">Voice Review Locked</p>
                      <p className="text-xs text-indigo-400 font-bold">
                        {Math.floor(voiceRecorder.duration / 60)}:
                        {(voiceRecorder.duration % 60).toString().padStart(2, '0')} READY
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={voiceRecorder.resetRecording}
                      className="rounded-full p-2.5 text-red-400 transition hover:bg-white hover:text-red-600 active:scale-95 shadow-sm"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                  <audio controls src={voiceRecorder.audioUrl} className="w-full h-10 brightness-110 drop-shadow-sm" />
                </div>
              )}
            </div>

            <InputControl
              label="Display Name"
              value={formState.displayName}
              onChange={(value) => setFormState((prev) => ({ ...prev, displayName: value }))}
              placeholder="How you'll appear publically"
              required={!formState.anonymous}
            />

            <div className="pt-2">
              <label className="flex items-center gap-4 text-sm font-bold text-gray-600 cursor-pointer group px-4 py-3 rounded-2xl border border-transparent transition-all hover:bg-gray-50 hover:border-gray-200">
                <input
                  type="checkbox"
                  checked={formState.anonymous}
                  onChange={() => setFormState((prev) => ({ ...prev, anonymous: !prev.anonymous }))}
                  className="h-6 w-6 rounded-lg border-2 border-gray-300 text-indigo-600 transition-all focus:ring-4 focus:ring-indigo-100 checked:bg-indigo-600"
                />
                <span className="uppercase tracking-widest group-hover:text-indigo-600 transition-colors">Post Anonymously</span>
              </label>
            </div>

            <div className="flex items-center gap-3 pt-6 border-t border-gray-100">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1">
                Discard
              </Button>
              <Button type="submit" disabled={status === "submitting"} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                {status === "submitting" ? "Uploading..." : "Publish Review"}
              </Button>
            </div>
          </form>
        )}
      </SideDrawer>

      {/* 3. Error Modal */}
      <Modal isOpen={errorModalOpen} close={() => setErrorModalOpen(false)}>
        <Modal.Title>System Notice</Modal.Title>
        <Modal.Body>
          <div className="py-6 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8" />
            </div>
            <p className="text-gray-900 font-bold mb-2 text-lg">Update Failed</p>
            <p className="text-gray-500 leading-relaxed">{errorMessage}</p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => setErrorModalOpen(false)} className="w-full bg-slate-900">
            Acknowledge
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 4. Reviews List */}
      <div className="space-y-8">
        {visibleReviews.map((review) => (
          <div key={review.id} className="relative transition-all pt-8 border-t border-gray-100 first:border-0 first:pt-0">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "h-11 w-11 rounded-full flex items-center justify-center text-white font-black text-lg overflow-hidden",
                  review.is_anonymous
                    ? "bg-slate-200 text-slate-400"
                    : "bg-gradient-to-br from-indigo-500 to-purple-600"
                )}>
                  {review.is_anonymous ? (
                    <User className="w-6 h-6" />
                  ) : (
                    review.display_name?.[0]?.toUpperCase() || "A"
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base leading-none">
                    {review.is_anonymous ? "Verified Buyer" : (review.display_name || "Verified Buyer")}
                  </h4>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      {new Date(review.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 self-start">
                <span className="text-base font-black text-gray-900 leading-none">{review.rating.toFixed(1)}</span>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-3.5 w-3.5",
                        i < Math.round(review.rating)
                          ? "text-indigo-500 fill-indigo-500"
                          : "text-gray-200"
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6">
              {review.title && <h5 className="text-base font-black text-gray-900 mb-1.5 leading-tight">{review.title}</h5>}
              <p className="text-sm text-gray-600 leading-relaxed font-medium whitespace-pre-wrap">{review.content}</p>
            </div>

            {/* Media Gallery Grid */}
            {review.review_media && review.review_media.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-3">
                {review.review_media.map((media) => {
                  const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ? `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${media.file_path}` : "";

                  if (media.file_type === 'video') {
                    return (
                      <div
                        key={media.id}
                        className="relative h-20 w-24 rounded-xl overflow-hidden cursor-pointer group transition-all sm:h-24 sm:w-24"
                        onClick={() => setActiveVideo({
                          url: publicUrl,
                          quote: review.content,
                          author: review.display_name || "Verified Buyer"
                        })}
                      >
                        {productThumbnail ? (
                          <Image
                            src={productThumbnail}
                            alt="video thumbnail"
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-slate-100" />
                        )}
                        <div className="absolute inset-0 bg-slate-900/30 group-hover:bg-indigo-900/10 transition-colors" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-md border border-white/40 flex items-center justify-center transition-all group-hover:scale-110 group-hover:bg-white/50">
                            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                          </div>
                        </div>
                      </div>
                    )
                  }

                  if (media.file_type === 'audio') {
                    return (
                      <div key={media.id} className="w-full sm:max-w-xs bg-indigo-50/50 rounded-2xl border border-indigo-100 p-4 shadow-sm transition-all hover:shadow-md hover:border-indigo-200">
                        <div className="flex items-center gap-2.5 mb-3">
                          <div className="h-8 w-8 rounded-xl bg-indigo-100 flex items-center justify-center shadow-inner">
                            <Mic className="h-4 w-4 text-indigo-600" />
                          </div>
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 block">Voice Note</span>
                          </div>
                        </div>
                        <audio controls src={publicUrl} className="w-full h-8 brightness-110" />
                      </div>
                    )
                  }

                  return (
                    <div key={media.id} className="relative h-20 w-24 flex-shrink-0 cursor-pointer overflow-hidden rounded-xl transition-all sm:h-24 sm:w-24">
                      <Image
                        src={publicUrl}
                        alt="review media"
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 640px) 96px, 128px"
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Read More Section */}
      {reviews.length > displayCount && (
        <div className="flex justify-center pt-6">
          <button
            onClick={() => setDisplayCount(prev => prev + 5)}
            className="flex items-center gap-2 rounded-xl bg-white border-2 border-indigo-50 px-6 py-3 text-xs font-black text-indigo-600 transition-all hover:bg-indigo-50 hover:border-indigo-100 hover:shadow-lg active:scale-95 text-nowrap"
          >
            Show More Reviews <X className="w-4 h-4 rotate-45" />
          </button>
        </div>
      )}

      {/* Video Play Modal */}
      <Modal isOpen={!!activeVideo} close={() => setActiveVideo(null)} size="large">
        <div className="relative aspect-[9/16] h-[80vh] max-h-[700px] mx-auto bg-black rounded-[2rem] overflow-hidden shadow-2xl border-[4px] border-slate-900 group">
          <video
            src={activeVideo?.url}
            controls
            autoPlay
            className="w-full h-full object-contain"
          />
          <button
            onClick={() => setActiveVideo(null)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/20 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white transition-all hover:bg-white hover:text-black hover:scale-110 active:scale-90 z-20"
          >
            <X className="w-6 h-6 font-black" />
          </button>
        </div>
      </Modal>
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
