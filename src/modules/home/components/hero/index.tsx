"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, Navigation } from "swiper/modules"
import type { Swiper as SwiperInstance } from "swiper/types"
import { ChevronLeft, ChevronRight } from "lucide-react"

import type { HomeHeroBanner } from "@lib/data/home-banners"
import { cn } from "@lib/util/cn"

const FALLBACK_BANNERS: HomeHeroBanner[] = [
  {
    id: "fallback-1",
    title: "Featured toys adventure",
    image_url: "/assets/images/slider_default.png",
    alt_text: "Featured toys adventure",
    link_url: null,
    sort_order: 0,
    is_active: true,
    starts_at: null,
    ends_at: null,
  },
]

import "swiper/css"
import "swiper/css/navigation"

const HERO_SWIPER_OPTIONS = {
  modules: [Autoplay, Navigation],
  grabCursor: true,
  spaceBetween: 16,
  slidesPerView: 1,
  autoplay: {
    delay: 5000,
    disableOnInteraction: false,
  },
  breakpoints: {
    640: {
      slidesPerView: 1,
    },
    1024: {
      slidesPerView: 2,
    },
    1440: {
      slidesPerView: 2.50,
    },
  },
}

const IMAGE_SIZES = "(min-width: 1440px) 40vw, (min-width: 1024px) 50vw, 100vw"

type HeroProps = {
  banners: HomeHeroBanner[]
}

const Hero = ({ banners }: HeroProps) => {
  const [isMounted, setIsMounted] = useState(false)
  const swiperRef = useRef<SwiperInstance | null>(null)
  const [loadedIds, setLoadedIds] = useState<Set<string>>(new Set())
  const prevElRef = useRef<HTMLButtonElement | null>(null)
  const nextElRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const bannersToRender = banners.length ? banners : FALLBACK_BANNERS

  const maxSlidesPerView = Math.ceil(
    Math.max(
      HERO_SWIPER_OPTIONS.slidesPerView,
      ...Object.values(HERO_SWIPER_OPTIONS.breakpoints).map(
        (bp) => bp.slidesPerView
      )
    )
  )

  const buildSwiperOptions = (slideCount: number) => ({
    ...HERO_SWIPER_OPTIONS,
    loop: slideCount > maxSlidesPerView,
  })

  const getNavConfig = () => ({
    prevEl: prevElRef.current,
    nextEl: nextElRef.current,
  })

  const handlePrev = () => {
    swiperRef.current?.slidePrev()
  }

  const handleNext = () => {
    swiperRef.current?.slideNext()
  }

  if (!isMounted) {
    return (
      <section className="w-full">
        <div className="w-full md:px-4 md:py-8">
          <div className="relative">
            <div className="flex gap-4 overflow-hidden">
              {bannersToRender.slice(0, 3).map((banner, index) => (
                <div
                  key={banner.id}
                  className={cn(
                    "relative shrink-0 overflow-hidden md:rounded-2xl aspect-[16/9] bg-slate-200",
                    index === 0 ? "w-full small:w-[calc(50%-8px)] large:w-[40%]" : "",
                    index === 1 ? "hidden small:block small:w-[calc(50%-8px)] large:w-[40%]" : "",
                    index === 2 ? "hidden large:block large:w-[20%]" : ""
                  )}
                >
                  <Image
                    src={banner.image_url}
                    alt={banner.alt_text || banner.title || "Homepage banner"}
                    fill
                    priority={index < 3}
                    sizes={IMAGE_SIZES}
                    className="object-cover"
                  />
                </div>
              ))}
            </div>

            {/* Placeholder Nav Buttons to prevent popping in after hydration */}
            <button
              type="button"
              className="absolute left-2 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-ui-border-base bg-white text-ui-fg-base shadow-sm z-20 cursor-default opacity-50"
              aria-hidden="true"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-ui-border-base bg-white text-ui-fg-base shadow-sm z-20 cursor-default opacity-50"
              aria-hidden="true"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="w-full">
      <div className="w-full md:px-4 md:py-8">
        <div className="relative overflow-hidden">
          <Swiper
            {...buildSwiperOptions(bannersToRender.length)}
            navigation={getNavConfig()}
            onBeforeInit={(swiper) => {
              swiperRef.current = swiper
              const navConfig = getNavConfig()
              swiper.params.navigation = {
                ...(typeof swiper.params.navigation === "object"
                  ? swiper.params.navigation
                  : {}),
                ...navConfig,
              }
            }}
            onSwiper={(swiper) => {
              swiperRef.current = swiper
              const navConfig = getNavConfig()
              swiper.params.navigation = {
                ...(typeof swiper.params.navigation === "object"
                  ? swiper.params.navigation
                  : {}),
                ...navConfig,
              }
              swiper.navigation?.destroy()
              swiper.navigation?.init()
              swiper.navigation?.update()
            }}
            className="hero-swiper"
          >
            {bannersToRender.map((slide, index) => {
              const BannerContent = () => (
                <div className="relative w-full overflow-hidden md:rounded-2xl bg-slate-200 aspect-[16/9]">
                  {index > 0 && (
                    <div
                      className={`absolute inset-0 ${loadedIds.has(slide.id)
                        ? "opacity-0"
                        : "animate-pulse bg-ui-bg-subtle"
                        } transition-opacity duration-300`}
                    />
                  )}
                  <Image
                    src={slide.image_url}
                    alt={slide.alt_text || slide.title || "Homepage banner"}
                    fill
                    priority={index === 0}
                    sizes={IMAGE_SIZES}
                    className="object-cover"
                    onLoad={() => {
                      setLoadedIds((prev) => {
                        const next = new Set(prev)
                        next.add(slide.id)
                        return next
                      })
                    }}
                  />
                </div>
              )

              return (
                <SwiperSlide key={slide.id}>
                  <div className="w-full">
                    {slide.link_url ? (
                      <a
                        href={slide.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        <BannerContent />
                      </a>
                    ) : (
                      <BannerContent />
                    )}
                  </div>
                </SwiperSlide>
              )
            })}
          </Swiper>
          <button
            type="button"
            className="hero-swiper-prev absolute left-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-ui-border-base bg-ui-bg-base text-ui-fg-base shadow-sm transition hover:bg-ui-bg-subtle z-20 bg-white"
            aria-label="Previous banner"
            ref={prevElRef}
            onClick={handlePrev}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="hero-swiper-next absolute right-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-ui-border-base bg-ui-bg-base text-ui-fg-base shadow-sm transition hover:bg-ui-bg-subtle z-20 bg-white"
            aria-label="Next banner"
            ref={nextElRef}
            onClick={handleNext}
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  )
}

export default Hero