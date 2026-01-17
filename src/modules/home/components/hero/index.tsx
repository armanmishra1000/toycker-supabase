"use client"

import { useEffect, useState, useCallback } from "react"
import Image from "next/image"
import Autoplay from "embla-carousel-autoplay"
import useEmblaCarousel from "embla-carousel-react"
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

const IMAGE_SIZES = "(min-width: 1440px) 40vw, (min-width: 1024px) 50vw, 100vw"

type HeroProps = {
  banners: HomeHeroBanner[]
}

const Hero = ({ banners }: HeroProps) => {
  const [isMounted, setIsMounted] = useState(false)
  const [loadedIds, setLoadedIds] = useState<Set<string>>(new Set())

  const bannersToRender = banners.length ? banners : FALLBACK_BANNERS

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      skipSnaps: false,
    },
    [
      Autoplay({
        delay: 5000,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    ]
  )

  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

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

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

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
        <div className="relative group">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex -ml-4">
              {bannersToRender.map((slide, index) => {
                const content = (
                  <div className="relative w-full overflow-hidden md:rounded-2xl bg-slate-200 aspect-[16/9]">
                    {index > 0 && (
                      <div
                        className={cn(
                          "absolute inset-0 transition-opacity duration-300",
                          loadedIds.has(slide.id) ? "opacity-0" : "animate-pulse bg-ui-bg-subtle"
                        )}
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
                          if (prev.has(slide.id)) return prev
                          const next = new Set(prev)
                          next.add(slide.id)
                          return next
                        })
                      }}
                    />
                  </div>
                )

                return (
                  <div
                    key={slide.id}
                    className="flex-[0_0_100%] pl-4 sm:flex-[0_0_50%] lg:flex-[0_0_40%] min-w-0"
                  >
                    <div className="w-full">
                      {slide.link_url ? (
                        <a
                          href={slide.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block cursor-pointer hover:opacity-90 transition-opacity"
                        >
                          {content}
                        </a>
                      ) : (
                        content
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={scrollPrev}
            className={cn(
              "absolute left-2 md:left-4 top-1/2 size-9 md:size-10 -translate-y-1/2 items-center justify-center rounded-full border border-ui-border-base bg-white text-ui-fg-base shadow-sm transition-all z-20 hover:bg-gray-50 flex",
              !canScrollPrev && "opacity-50 cursor-not-allowed"
            )}
            aria-label="Previous banner"
          >
            <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={scrollNext}
            className={cn(
              "absolute right-2 md:right-4 top-1/2 size-9 md:size-10 -translate-y-1/2 items-center justify-center rounded-full border border-ui-border-base bg-white text-ui-fg-base shadow-sm transition-all z-20 hover:bg-gray-50 flex",
              !canScrollNext && "opacity-50 cursor-not-allowed"
            )}
            aria-label="Next banner"
          >
            <ChevronRight className="h-4 w-4 md:h-5 md:w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  )
}

export default Hero