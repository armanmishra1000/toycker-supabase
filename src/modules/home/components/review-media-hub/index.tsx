"use client"

import { useCallback, useEffect, useRef, useState, useMemo, type KeyboardEvent, type MouseEvent } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Pause, Play, Star, X } from "lucide-react"
import useEmblaCarousel from "embla-carousel-react"
import { cn } from "@lib/util/cn"
import { getImageUrl } from "@/lib/util/get-image-url"

type ReviewType = "text" | "video" | "image"

type BaseReview = {
  id: string
  type: ReviewType
  quote?: string
  summary?: string
  videoSrc?: string | null
  posterSrc?: string | null
  author: string
  avatar: string
  tag?: string
  priceCurrent?: string
  priceOriginal?: string
  cardBg?: string
  cardBorder?: string
  productImage?: string | null
}

type Review = BaseReview

type AudioReview = {
  id: string
  title: string
  author: string
  durationLabel: string
  coverImage: string | null
  audioSrc: string | null
}


const formatTime = (timeInSeconds?: number) => {
  if (!Number.isFinite(timeInSeconds) || timeInSeconds === undefined) {
    return "00:00"
  }
  const minutes = Math.floor(timeInSeconds / 60)
  const seconds = Math.floor(timeInSeconds % 60)
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
}

const ReviewCard = ({ review }: { review: Review }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const renderStars = (colorClass: string, extraClasses = "") => (
    <div className={`flex items-center gap-1.5 ${extraClasses}`} aria-label="Rated 5 out of 5">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} className={`h-5 w-5 fill-current ${colorClass}`} />
      ))}
    </div>
  )

  const handlePlayClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    const video = videoRef.current
    if (!video) {
      return
    }
    video.controls = true
    try {
      await video.play()
      setIsPlaying(true)
    } catch {
      setIsPlaying(false)
    }
  }

  const handlePauseClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    const video = videoRef.current
    if (!video) {
      return
    }
    video.pause()
    setIsPlaying(false)
  }

  if ((review.type === "video" && review.videoSrc) || (review.type === "image" && review.posterSrc)) {
    return (
      <article className="group relative flex h-[480px] flex-col overflow-hidden rounded-3xl bg-black text-white">
        {review.type === "video" ? (
          <video
            ref={videoRef}
            controls={isPlaying}
            playsInline
            poster={review.posterSrc ?? undefined}
            className="absolute inset-0 h-full w-full object-cover transition duration-500 ease-out group-hover:scale-105"
            aria-label={`Video review from ${review.author}`}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          >
            <source src={review.videoSrc ?? undefined} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <Image
            src={review.posterSrc!}
            alt={`Review from ${review.author}`}
            fill
            className="absolute inset-0 h-full w-full object-cover transition duration-500 ease-out group-hover:scale-105"
          />
        )}
        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/80 transition-opacity duration-300 ${isPlaying ? "opacity-0" : ""}`}
        />

        <div
          className={`relative z-10 flex h-full flex-col justify-between p-6 transition-opacity duration-500 ${isPlaying ? "opacity-0" : ""}`}
        >
          <div className="flex items-center justify-between text-sm font-semibold tracking-wide">
            {review.tag && (
              <span className="rounded-full bg-white/80 px-3 py-1 text-xs text-[#1f2937]">
                {review.tag}
              </span>
            )}
            {review.priceCurrent && (
              <div className="text-right">
                <span className="block text-lg font-semibold text-white">{review.priceCurrent}</span>
                {review.priceOriginal && (
                  <span className="text-sm text-white/70 line-through">{review.priceOriginal}</span>
                )}
              </div>
            )}
          </div>

          <div>
            {review.quote && (
              <p className="text-2xl font-semibold leading-snug text-white">“{review.quote}”</p>
            )}
            <p className="mt-6 text-sm font-semibold text-white">{review.author}</p>
            {renderStars("text-white")}
          </div>
        </div>

        {review.type === "video" && !isPlaying && (
          <button
            type="button"
            aria-label={`Play ${review.author}'s story`}
            onClick={handlePlayClick}
            className="absolute inset-x-0 bottom-6 z-40 mx-auto flex w-max items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#111827] opacity-0 transition delay-150 group-hover:translate-y-0 group-hover:opacity-100"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#111827] text-white">
              <Play className="h-3.5 w-3.5" />
            </span>
            Play story
          </button>
        )}
        {review.type === "video" && isPlaying && (
          <button
            type="button"
            aria-label={`Pause ${review.author}'s story`}
            onClick={handlePauseClick}
            className="absolute inset-x-0 bottom-6 z-40 mx-auto flex w-max items-center gap-1.5 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-[#111827]"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#111827] text-white">
              <Pause className="h-3.5 w-3.5" />
            </span>
            Pause
          </button>
        )}
      </article>
    )
  }

  const cardBg = review.cardBg ?? "bg-white"
  const cardBorder = review.cardBorder ?? "border-white/70"
  const productImage = review.productImage ?? review.avatar
  const productName = review.tag ?? "Featured product"

  return (
    <article className={`flex h-[480px] flex-col rounded-3xl border ${cardBorder} ${cardBg} p-6`}>
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-white">
          <Image src={productImage} alt={productName} fill sizes="80px" className="object-cover" />
        </div>
        <div className="space-y-1">
          {productName && <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9ca3af]">{productName}</p>}
          {review.priceCurrent && (
            <p className="text-2xl font-semibold text-[#111827]">{review.priceCurrent}</p>
          )}
          {review.priceOriginal && (
            <p className="text-sm text-[#9ca3af] line-through">{review.priceOriginal}</p>
          )}
        </div>
      </div>

      {review.quote && (
        <blockquote className="mt-6 text-lg leading-relaxed text-[#111827]">“{review.quote}”</blockquote>
      )}

      <div className={`mt-6 border-t ${cardBorder} pt-4`}>
        <p className="font-semibold italic text-[#111827]">{review.author}</p>
        {renderStars("text-[#fbbf24]", "mt-2")}
      </div>
    </article>
  )
}

const ReviewMediaHub = ({ reviews = [] }: { reviews: any[] }) => {
  const [isMounted, setIsMounted] = useState(false)

  // Map dynamic reviews to the internal types
  const displayReviews: Review[] = useMemo(() => {
    return reviews
      .filter(hr => {
        const audioMedia = hr.review.review_media?.some((m: any) => m.file_type === 'audio')
        return !audioMedia // Exclude audio reviews from carousel
      })
      .map(hr => {
        const r = hr.review
        const videoMedia = r.review_media?.find((m: any) => m.file_type === 'video')
        const imageMedia = r.review_media?.find((m: any) => m.file_type === 'image')

        const product = r.product
        const price = product?.price ? `₹${product.price.toFixed(2)}` : undefined

        let type: ReviewType = 'text'
        if (videoMedia) type = 'video'
        else if (imageMedia) type = 'image'

        return {
          id: r.id,
          type,
          quote: r.content,
          author: r.is_anonymous ? "Verified Buyer" : (r.display_name || "Verified Buyer"),
          avatar: "",
          videoSrc: videoMedia ? getImageUrl(videoMedia.file_path) : undefined,
          posterSrc: imageMedia ? getImageUrl(imageMedia.file_path) : undefined,
          tag: product?.name,
          priceCurrent: price,
          productImage: product?.image_url ? getImageUrl(product.image_url) : undefined,
          cardBg: r.rating >= 4 ? "bg-[#fffdf4]" : "bg-[#f0fbff]",
          cardBorder: r.rating >= 4 ? "border-[#fde9c8]" : "border-[#cdeefd]"
        }
      })
  }, [reviews])

  const audioReviews: AudioReview[] = useMemo(() => {
    const allAudio: AudioReview[] = []
    reviews.forEach(hr => {
      const r = hr.review
      const audioMedia = r.review_media?.find((m: any) => m.file_type === 'audio')
      if (audioMedia) {
        allAudio.push({
          id: `audio-${r.id}`,
          title: r.title || "Voice Review",
          author: r.is_anonymous ? "Verified Buyer" : (r.display_name || "Verified Buyer"),
          durationLabel: "Voice",
          coverImage: (r.product?.image_url ? getImageUrl(r.product.image_url) : "/assets/images/placeholder.jpg") as string | null,
          audioSrc: getImageUrl(audioMedia.file_path) as string | null
        })
      }
    })
    return allAudio
  }, [reviews])
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
  })

  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false)
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({})
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null)
  const activeAudioRef = useRef<string | null>(null)
  const [audioProgress, setAudioProgress] = useState<Record<string, number>>({})
  const [audioDurations, setAudioDurations] = useState<Record<string, number>>({})
  const [audioCurrentTime, setAudioCurrentTime] = useState<Record<string, number>>({})

  type EmblaApiType = NonNullable<ReturnType<typeof useEmblaCarousel>[1]>

  const onSelect = useCallback((api: EmblaApiType) => {
    setCanScrollPrev(api.canScrollPrev())
    setCanScrollNext(api.canScrollNext())
  }, [])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!emblaApi) return
    onSelect(emblaApi)
    emblaApi.on("select", () => onSelect(emblaApi))
    emblaApi.on("reInit", () => onSelect(emblaApi))
  }, [emblaApi, onSelect])

  // If no reviews, don't render the section
  if (isMounted && displayReviews.length === 0) {
    return null
  }

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  useEffect(() => {
    if (isAudioModalOpen) {
      const previousOverflow = document.body.style.overflow
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = previousOverflow
      }
    }

    const currentlyActive = activeAudioRef.current
    if (currentlyActive) {
      audioRefs.current[currentlyActive]?.pause()
      setActiveAudioId(null)
    }
    return undefined
  }, [isAudioModalOpen])

  useEffect(() => {
    activeAudioRef.current = activeAudioId
  }, [activeAudioId])

  const startAudio = async (id: string) => {
    const audio = audioRefs.current[id]
    if (!audio) {
      return
    }

    const currentlyActive = activeAudioRef.current
    if (currentlyActive && currentlyActive !== id) {
      audioRefs.current[currentlyActive]?.pause()
    }

    try {
      await audio.play()
      setActiveAudioId(id)
    } catch {
      setActiveAudioId(null)
    }
  }

  const openAudioModal = () => {
    setIsAudioModalOpen(true)
  }

  const closeAudioModal = () => {
    setIsAudioModalOpen(false)
  }

  const syncAudioState = (id: string) => {
    const audio = audioRefs.current[id]
    if (!audio || !audio.duration) {
      return
    }
    setAudioProgress((prev) => ({ ...prev, [id]: audio.currentTime / audio.duration }))
    setAudioCurrentTime((prev) => ({ ...prev, [id]: audio.currentTime }))
  }

  const handleAudioToggle = async (id: string) => {
    const audio = audioRefs.current[id]
    if (!audio) {
      return
    }

    if (audio.paused) {
      await startAudio(id)
    } else {
      audio.pause()
      setActiveAudioId(null)
    }
  }

  const handleAudioLoaded = (id: string) => {
    const audio = audioRefs.current[id]
    if (!audio) {
      return
    }
    setAudioDurations((prev) => ({ ...prev, [id]: audio.duration }))
  }

  const handleAudioTimeUpdate = (id: string) => {
    syncAudioState(id)
  }

  const handleAudioEnd = (id: string) => {
    if (activeAudioId === id) {
      setActiveAudioId(null)
    }
    setAudioProgress((prev) => ({ ...prev, [id]: 0 }))
    setAudioCurrentTime((prev) => ({ ...prev, [id]: 0 }))
  }

  const handleProgressClick = (event: MouseEvent<HTMLDivElement>, id: string) => {
    const audio = audioRefs.current[id]
    if (!audio || !audio.duration) {
      return
    }
    const rect = event.currentTarget.getBoundingClientRect()
    const clickPosition = event.clientX - rect.left
    const ratio = Math.min(Math.max(clickPosition / rect.width, 0), 1)
    audio.currentTime = ratio * audio.duration
    setAudioProgress((prev) => ({ ...prev, [id]: ratio }))
    setAudioCurrentTime((prev) => ({ ...prev, [id]: audio.currentTime }))
    void startAudio(id)
  }

  const handleSliderKeyDown = (event: KeyboardEvent<HTMLDivElement>, id: string) => {
    const audio = audioRefs.current[id]
    if (!audio || !audio.duration) {
      return
    }

    let nextTime = audio.currentTime
    if (event.key === "ArrowRight") {
      nextTime = Math.min(audio.duration, audio.currentTime + 5)
    } else if (event.key === "ArrowLeft") {
      nextTime = Math.max(0, audio.currentTime - 5)
    } else if (event.key === "Home") {
      nextTime = 0
    } else if (event.key === "End") {
      nextTime = audio.duration
    } else if (event.key === " " || event.key === "Enter") {
      event.preventDefault()
      handleAudioToggle(id)
      return
    } else {
      return
    }

    event.preventDefault()
    audio.currentTime = nextTime
    setAudioProgress((prev) => ({ ...prev, [id]: nextTime / audio.duration }))
    setAudioCurrentTime((prev) => ({ ...prev, [id]: nextTime }))
    void startAudio(id)
  }

  return (
    <>
      <section className="w-full" aria-labelledby="review-media-hub-heading">
        <div className="mx-auto max-w-screen-2xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#c45700]">Customer say!</p>
              <h2 id="review-media-hub-heading" className="mt-3 text-4xl font-semibold text-[#111827]">
                Trusted by parents and creators across India
              </h2>
            </div>
            <button
              type="button"
              onClick={openAudioModal}
              className="hidden items-center gap-2 rounded-full border border-[#111827] px-5 py-3 text-sm font-semibold text-[#111827] transition hover:bg-[#111827] hover:text-white lg:inline-flex"
            >
              Listen to audio stories
            </button>
          </div>

          {!isMounted ? (
            <div className="h-[480px] animate-pulse bg-ui-bg-subtle rounded-3xl" />
          ) : (
            <div className="relative">
              <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex -ml-8">
                  {displayReviews.map((review) => (
                    <div
                      key={review.id}
                      className="flex-[0_0_100%] pl-8 min-w-0 sm:flex-[0_0_83.333%] md:flex-[0_0_50%] xl:flex-[0_0_33.333%]"
                    >
                      <ReviewCard review={review} />
                    </div>
                  ))}
                </div>
              </div>

              {displayReviews.length > 1 && (
                <div className="absolute -bottom-20 left-0 right-0 flex justify-between px-4 pb-4 z-10 sm:left-auto sm:flex-none sm:justify-normal sm:gap-4 sm:pr-4">
                  <button
                    type="button"
                    onClick={scrollPrev}
                    aria-label="Previous reviews"
                    className={cn(
                      "inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white transition",
                      !canScrollPrev && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={scrollNext}
                    aria-label="Next reviews"
                    className={cn(
                      "inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white transition",
                      !canScrollNext && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="mt-24 flex justify-center sm:mt-20 lg:hidden">
            <button
              type="button"
              onClick={openAudioModal}
              className="inline-flex w-full max-w-sm items-center justify-center gap-2 rounded-full border border-[#111827] px-5 py-3 text-sm font-semibold text-[#111827] transition hover:bg-[#111827] hover:text-white"
            >
              Listen to audio stories
            </button>
          </div>
        </div>

        {isAudioModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-stretch justify-stretch bg-black/45 p-0 sm:items-center sm:justify-center sm:px-4 sm:py-8"
            onClick={closeAudioModal}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="audio-modal-title"
              className="relative h-full w-full max-w-none overflow-y-auto rounded-none border-none bg-gradient-to-b from-white via-[#fff8ec] to-white p-5 sm:h-auto sm:max-h-[90vh] sm:max-w-3xl sm:rounded-[32px] sm:border sm:border-white/60 sm:p-7 md:p-8"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={closeAudioModal}
                className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#111827] transition hover:bg-[#111827] hover:text-white sm:right-6 sm:top-6"
                aria-label="Close audio reviews"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex flex-col gap-4 pt-12 sm:flex-row sm:items-start sm:justify-between sm:pt-2">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#c45700]">Audio reviews</p>
                  <h3 id="audio-modal-title" className="mt-2 text-3xl font-semibold text-[#111827]">
                    Hear Toycker stories on demand
                  </h3>
                  <p className="mt-2 text-sm text-[#6b7280]">
                    Stream quick clips from parents and creators describing their Toycker experiences.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {audioReviews.map((audio) => {
                  const progress = audioProgress[audio.id] ?? 0
                  const safeProgress = Math.min(Math.max(progress, 0), 1)
                  const currentTime = audioCurrentTime[audio.id] ?? 0
                  const totalDuration = audioDurations[audio.id]
                  const formattedTotal = totalDuration ? formatTime(totalDuration) : audio.durationLabel
                  const sliderMax = totalDuration ?? 1

                  return (
                    <article
                      key={audio.id}
                      className="flex flex-col gap-5 rounded-3xl border border-[#ffe2b8] bg-gradient-to-br from-white via-[#fff8ec] to-[#ffeeda] p-5 text-[#1f2937]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-[#ffd7a0] bg-white">
                          <Image src={audio.coverImage || "/assets/images/placeholder.jpg"} alt={audio.title} fill sizes="80px" className="object-cover" />
                        </div>
                        <div className="flex-1">
                          <p className="text-lg font-semibold text-[#1f2937]">{audio.title}</p>
                          <p className="text-sm text-[#7c5c2e]">{audio.author}</p>
                          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#fff1dc] px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#b45309]">
                            {audio.durationLabel}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <button
                          type="button"
                          onClick={() => handleAudioToggle(audio.id)}
                          className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${activeAudioId === audio.id
                            ? "border-transparent bg-[#ff8a00] text-white shadow-[0_12px_30px_rgba(255,138,0,0.35)]"
                            : "border-[#ffd7a0] bg-white text-[#b45309] hover:bg-[#fff5e5]"
                            }`}
                          aria-label={`${activeAudioId === audio.id ? "Pause" : "Play"} ${audio.title}`}
                        >
                          {activeAudioId === audio.id ? (
                            <>
                              <Pause className="h-4 w-4" />
                              Pause story
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4" />
                              Play story
                            </>
                          )}
                        </button>

                        <div className="flex items-center gap-3 text-[#9a7a4d]">
                          <span className="text-xs font-semibold">{formatTime(currentTime)}</span>
                          <div
                            role="slider"
                            aria-label={`Timeline for ${audio.title}`}
                            aria-valuemin={0}
                            aria-valuemax={sliderMax}
                            aria-valuenow={currentTime}
                            aria-valuetext={`${formatTime(currentTime)} of ${formattedTotal}`}
                            tabIndex={0}
                            onClick={(event) => handleProgressClick(event, audio.id)}
                            onKeyDown={(event) => handleSliderKeyDown(event, audio.id)}
                            className="relative h-2 flex-1 cursor-pointer rounded-full bg-[#ffe2b8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffbb3d]"
                          >
                            <div
                              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#ffdd55] to-[#ff8a00]"
                              style={{ width: `${safeProgress * 100}%` }}
                            />
                            <span
                              className="absolute top-1/2 h-3 w-3 -translate-y-1/2 -translate-x-1/2 rounded-full border border-white bg-[#ffbb3d] shadow"
                              style={{ left: `${safeProgress * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-[#b45309]">{formattedTotal}</span>
                        </div>
                      </div>

                      <audio
                        ref={(node) => {
                          audioRefs.current[audio.id] = node
                        }}
                        src={audio.audioSrc ?? undefined}
                        preload="metadata"
                        onLoadedMetadata={() => handleAudioLoaded(audio.id)}
                        onTimeUpdate={() => handleAudioTimeUpdate(audio.id)}
                        onEnded={() => handleAudioEnd(audio.id)}
                        className="hidden"
                      >
                        <track kind="captions" />
                      </audio>
                    </article>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  )
}

export default ReviewMediaHub
