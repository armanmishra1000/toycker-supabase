"use client"

import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Pause, Play, Star, X } from "lucide-react"
import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation } from "swiper/modules"
import type { Swiper as SwiperInstance } from "swiper/types"

import "swiper/css"
import "swiper/css/navigation"

type ReviewType = "text" | "video"

type BaseReview = {
  id: string
  type: ReviewType
  quote?: string
  summary?: string
  videoSrc?: string
  posterSrc?: string
  author: string
  avatar: string
  tag?: string
  priceCurrent?: string
  priceOriginal?: string
  cardBg?: string
  cardBorder?: string
  productImage?: string
}

type Review = BaseReview

type AudioReview = {
  id: string
  title: string
  author: string
  durationLabel: string
  coverImage: string
  audioSrc: string
}

const REVIEWS: Review[] = [
  {
    id: "text-anika",
    type: "text",
    quote:
      "I bought the art & craft kit for my niece and she absolutely loved it. Good variety of items inside and very creative",
    author: "Neha Verma",
    avatar: "/assets/images/H9b572778112d43ce886ad0cc030523e4N.jpg",
    cardBg: "bg-[#fffdf4]",
    cardBorder: "border-[#fde9c8]",
    tag: "Frictions Airplanes",
    priceCurrent: "₹99.00",
    priceOriginal: "₹125.00",
    productImage: "/assets/images/frictions-airplanes.jpg",
  },
  {
    id: "video-exclusive-1",
    type: "video",
    quote: "Toycker helped us shoot the Dodge Mini Metal Car in one sunrise session without renting extra gear.",
    videoSrc: "/assets/videos/exclusive-1.mp4",
    author: "Pia Patil",
    avatar: "/assets/images/Hee58b635f526431faa4076d3a0750afeD.jpg",
    tag: "Dodge Mini Metal Car",
    priceCurrent: "₹160.00",
    priceOriginal: "₹250.00",
  },
  {
    id: "text-rob",
    type: "text",
    quote:
      "Very happy with the quality of toys. They are safe, colorful, and exactly as shown on the website. Will definitely order again.",
    author: " Neha Verma",
    avatar: "/assets/images/Hdba07b027a41.jpg",
    cardBg: "bg-[#f0fbff]",
    cardBorder: "border-[#cdeefd]",
    tag: "Plastic Golf Set with Golf Sticks, Platform Cup & 2 Balls Kids Boys",
    priceCurrent: "₹518.00",
    priceOriginal: "₹575.00",
    productImage: "/assets/images/51acyqZLHsL._UF1000_1000_QL80.jpg",
  },
  {
    id: "video-exclusive-2",
    type: "video",
    quote: "We stitched together a full product walkthrough for the Dodge Mini Metal Car over lunch break.",
    videoSrc: "/assets/videos/exclusive-2.mp4",
    author: "Ria Goswami",
    avatar: "/assets/images/Hdba07b027a41.jpg",
    tag: "Dodge Mini Metal Car",
    priceCurrent: "₹160.00",
    priceOriginal: "₹250.00",
  },
  {
    id: "text-dan",
    type: "text",
    quote:
      "The building blocks set is amazing! My son spends hours creating different shapes and houses. Very good quality and safe for kids.",
    author: "Priya Sharma",
    avatar: "/assets/images/H9b572778112d43ce886ad0cc030523e4N.jpg",
    cardBg: "bg-[#f4f5ff]",
    cardBorder: "border-[#d9dbff]",
    tag: "Machine Gun Super Combat - Light and Sound",
    priceCurrent: "₹549.00",
    priceOriginal: "₹649.00",
    productImage: "/assets/images/61K1TDQYuCL._SL1280.jpg",
  },
  {
    id: "video-exclusive-3",
    type: "video",
    quote: "The exclusive series lets us alternate macro shots and motion blur without touching the editing suite.",
    videoSrc: "/assets/videos/exclusive-3.mp4",
    author: "Meera Venkatesh",
    avatar: "/assets/images/Hee58b635f526431faa4076d3a0750afeD.jpg",
    tag: "Dodge Mini Metal Car",
    priceCurrent: "₹160.00",
    priceOriginal: "₹250.00",
  },
  {
    id: "text-neha",
    type: "text",
    quote:
      "Bulk orders arrive compartmentalized so volunteers can set up mini labs in minutes. Parents constantly send us thank-you notes after every Toycker pop-up.",
    author: "Neha Kulkarni",
    avatar: "/assets/images/Hee58b635f526431faa4076d3a0750afeD.jpg",
    cardBg: "bg-[#fef2fb]",
    cardBorder: "border-[#fbd3ee]",
    tag: "Dodge Mini Metal Car",
    priceCurrent: "₹160.00",
    priceOriginal: "₹250.00",
    productImage: "/assets/images/frictions-airplanes.jpg",
  },
]

const AUDIO_REVIEWS: AudioReview[] = [
  {
    id: "audio-1",
    title: "Playroom onboarding in 3 minutes",
    author: "Vandana Kapoor",
    durationLabel: "03:12",
    coverImage: "/assets/images/51acyqZLHsL._UF1000_1000_QL80.jpg",
    audioSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  {
    id: "audio-2",
    title: "Dodge Mini showcase walkthrough",
    author: "Rishi Malhotra",
    durationLabel: "02:27",
    coverImage: "/assets/images/61K1TDQYuCL._SL1280.jpg",
    audioSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  },
  {
    id: "audio-3",
    title: "Weekend workshop recap",
    author: "Garima Patel",
    durationLabel: "04:05",
    coverImage: "/assets/images/frictions-airplanes.jpg",
    audioSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
  },
]

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

  if (review.type === "video" && review.videoSrc) {
    return (
      <article className="group relative flex h-[480px] flex-col overflow-hidden rounded-3xl bg-black text-white">
        <video
          ref={videoRef}
          controls={isPlaying}
          playsInline
          poster={review.posterSrc}
          className="absolute inset-0 h-full w-full object-cover transition duration-500 ease-out group-hover:scale-105"
          aria-label={`Video review from ${review.author}`}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        >
          <source src={review.videoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-black/5 to-black/70 transition-opacity duration-300 ${isPlaying ? "opacity-0" : "group-hover:opacity-0"}`}
        />

        <div
          className={`relative z-10 flex h-full flex-col justify-between p-6 transition-opacity duration-500 ${
            isPlaying ? "opacity-0" : "group-hover:opacity-0"
          }`}
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

        {!isPlaying ? (
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
        ) : (
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

const ReviewMediaHub = () => {
  const swiperRef = useRef<SwiperInstance | null>(null)
  const prevRef = useRef<HTMLButtonElement | null>(null)
  const nextRef = useRef<HTMLButtonElement | null>(null)
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false)
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({})
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null)
  const activeAudioRef = useRef<string | null>(null)
  const [audioProgress, setAudioProgress] = useState<Record<string, number>>({})
  const [audioDurations, setAudioDurations] = useState<Record<string, number>>({})
  const [audioCurrentTime, setAudioCurrentTime] = useState<Record<string, number>>({})

  useEffect(() => {
    const swiper = swiperRef.current
    if (!swiper || typeof swiper.params.navigation === "boolean" || !swiper.params.navigation) {
      return
    }
    swiper.params.navigation.prevEl = prevRef.current
    swiper.params.navigation.nextEl = nextRef.current
    swiper.navigation.destroy()
    swiper.navigation.init()
    swiper.navigation.update()
  }, [])

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

        <div className="relative">
          <Swiper
            modules={[Navigation]}
            spaceBetween={32}
            slidesPerView={1}
            breakpoints={{
              640: { slidesPerView: 1.2 },
              768: { slidesPerView: 2 },
              1280: { slidesPerView: 3 },
            }}
            navigation={{
              prevEl: prevRef.current,
              nextEl: nextRef.current,
            }}
            onSwiper={(swiper) => {
              swiperRef.current = swiper
            }}
            className="!overflow-hidden"
          >
            {REVIEWS.map((review) => (
              <SwiperSlide key={review.id} className="!h-auto">
                <ReviewCard review={review} />
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="pointer-events-none absolute -bottom-20 left-0 right-0 flex justify-between px-4 pb-4 z-10 sm:left-auto sm:flex-none sm:justify-normal sm:gap-4 sm:pr-4">
            <button
              type="button"
              ref={prevRef}
              aria-label="Previous reviews"
              className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white transition cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              ref={nextRef}
              aria-label="Next reviews"
              className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white transition cursor-pointer"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

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
                  Stream quick clips from parents and creators describing their Dodge Mini Metal Car builds.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {AUDIO_REVIEWS.map((audio) => {
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
                        <Image src={audio.coverImage} alt={audio.title} fill sizes="80px" className="object-cover" />
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
                        className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                          activeAudioId === audio.id
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
                      src={audio.audioSrc}
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
