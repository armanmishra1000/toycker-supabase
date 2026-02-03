"use client"

import { useState } from "react"
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
      setStatus("error")
    }
  }


  return (
    <div className="flex flex-col gap-8">

      <section className="rounded-2xl border border-gray-200 bg-white px-6 py-8 text-center">
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
                            <Image
                              src={URL.createObjectURL(file)}
                              alt="preview"
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
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

                  {/* Voice Recording Section */}
                  <div className="space-y-3">
                    <span className="text-sm font-semibold text-gray-700">Record Voice Review (Optional)</span>

                    {/* Error Message */}
                    {voiceRecorder.status === 'error' && voiceRecorder.errorMessage && (
                      <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3" role="alert" aria-live="assertive">
                        <p className="text-sm text-red-700">{voiceRecorder.errorMessage}</p>
                      </div>
                    )}

                    {/* Idle State - Show Start Recording Button */}
                    {(voiceRecorder.status === 'idle' || voiceRecorder.status === 'error') && !voiceRecorder.audioBlob && (
                      <button
                        type="button"
                        onClick={voiceRecorder.startRecording}
                        className="flex items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 px-4 py-3 text-gray-600 transition-all duration-200 hover:border-primary hover:bg-primary/10 hover:text-primary active:scale-95"
                        aria-label="Start voice recording"
                      >
                        <Mic className="h-5 w-5" />
                        <span className="text-sm font-medium">Start Recording</span>
                      </button>
                    )}

                    {/* Requesting Permission State */}
                    {voiceRecorder.status === 'requesting_permission' && (
                      <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3" aria-live="polite">
                        <p className="text-sm text-blue-700">Requesting microphone permission...</p>
                      </div>
                    )}

                    {/* Recording State */}
                    {(voiceRecorder.status === 'recording' || voiceRecorder.status === 'paused') && (
                      <div className="rounded-xl border-2 border-red-300 bg-red-50/50 px-4 py-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {voiceRecorder.status === 'recording' && (
                              <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />
                            )}
                            <span className="text-sm font-semibold text-gray-900">
                              {voiceRecorder.status === 'recording' ? 'Recording...' : 'Paused'}
                            </span>
                          </div>
                          <span className="text-sm font-mono text-gray-700" aria-live="polite">
                            {Math.floor(voiceRecorder.duration / 60).toString().padStart(2, '0')}:
                            {(voiceRecorder.duration % 60).toString().padStart(2, '0')} / 05:00
                          </span>
                        </div>

                        {/* Simple Waveform Visualization */}
                        {voiceRecorder.status === 'recording' && (
                          <div className="flex items-center justify-center gap-1 h-12" aria-hidden="true">
                            {[...Array(20)].map((_, i) => (
                              <div
                                key={i}
                                className="w-1 bg-red-400 rounded-full animate-pulse"
                                style={{
                                  height: `${20 + Math.random() * 60}%`,
                                  animationDelay: `${i * 50}ms`,
                                  animationDuration: `${800 + Math.random() * 400}ms`
                                }}
                              />
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2">
                          {voiceRecorder.status === 'recording' ? (
                            <button
                              type="button"
                              onClick={voiceRecorder.pauseRecording}
                              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-yellow-600 active:scale-95"
                              aria-label="Pause recording"
                            >
                              <Pause className="h-4 w-4" />
                              Pause
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={voiceRecorder.resumeRecording}
                              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-600 active:scale-95"
                              aria-label="Resume recording"
                            >
                              <Play className="h-4 w-4" />
                              Resume
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={voiceRecorder.stopRecording}
                            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 active:scale-95"
                            aria-label="Stop recording"
                          >
                            <Square className="h-4 w-4" />
                            Stop
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Stopped State - Show Preview */}
                    {voiceRecorder.status === 'stopped' && voiceRecorder.audioUrl && (
                      <div className="rounded-xl border-2 border-green-300 bg-green-50/50 px-4 py-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                            <Mic className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">Voice Review Recorded</p>
                            <p className="text-xs text-gray-600">
                              Duration: {Math.floor(voiceRecorder.duration / 60)}:
                              {(voiceRecorder.duration % 60).toString().padStart(2, '0')}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={voiceRecorder.resetRecording}
                            className="rounded-full p-2 text-red-500 transition hover:bg-red-100 active:scale-95"
                            aria-label="Delete voice recording"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Audio Playback */}
                        <audio
                          controls
                          src={voiceRecorder.audioUrl}
                          className="w-full"
                          aria-label="Voice review playback"
                        />
                      </div>
                    )}
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
          <div key={review.id} className="group border-b border-gray-100 pb-8 last:border-0 pt-2 transition-all hover:bg-gray-50/50 -mx-4 px-4 rounded-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-11 w-11 rounded-full flex items-center justify-center text-white shadow-sm border-2 border-white",
                  review.is_anonymous
                    ? "bg-slate-200 text-slate-400"
                    : "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"
                )}>
                  {review.is_anonymous ? (
                    <User className="w-6 h-6" />
                  ) : (
                    <span className="font-bold text-lg">{review.display_name?.[0]?.toUpperCase() || "A"}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900">
                      {review.is_anonymous ? "Verified Buyer" : (review.display_name || "Verified Buyer")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="flex items-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < review.rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
                      ))}
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium translate-y-[0.5px]">
                      {new Date(review.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="font-bold text-gray-900 leading-tight">{review.title}</h4>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{review.content}</p>
            </div>

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
                      <div key={media.id} className="group/voice h-28 w-72 flex-shrink-0 rounded-2xl overflow-hidden border border-indigo-100 bg-white shadow-sm transition-all hover:shadow-md hover:border-indigo-200">
                        <div className="h-full flex flex-col p-3 relative overflow-hidden">
                          {/* Decorative Waveform SVG */}
                          <div className="absolute right-0 top-0 h-full w-24 opacity-[0.03] pointer-events-none">
                            <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none">
                              {[...Array(10)].map((_, i) => (
                                <rect
                                  key={i}
                                  x={i * 10}
                                  y={50 - (Math.random() * 40)}
                                  width="4"
                                  height={20 + (Math.random() * 60)}
                                  fill="currentColor"
                                  className="text-indigo-600"
                                />
                              ))}
                            </svg>
                          </div>

                          <div className="flex items-center gap-2 text-indigo-700 mb-2">
                            <div className="p-1.5 rounded-lg bg-indigo-50">
                              <Mic className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Voice Review</span>
                          </div>

                          <audio controls className="w-full h-8 custom-audio-player" style={{ height: '32px' }}>
                            <source src={publicUrl} />
                          </audio>

                          <div className="mt-auto flex justify-center">
                            <span className="text-[9px] text-indigo-300 font-medium">Click to hear the customer's voice</span>
                          </div>
                        </div>
                      </div>
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
