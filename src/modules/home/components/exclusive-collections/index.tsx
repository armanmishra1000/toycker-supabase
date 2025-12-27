"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay } from "swiper/modules"
import type { Swiper as SwiperInstance } from "swiper/types"
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react"

import "swiper/css"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getProductPrice } from "@lib/util/get-product-price"
import { buildDisplayPrice, type DisplayPrice } from "@lib/util/display-price"
import type { ExclusiveCollectionEntry } from "@lib/data/exclusive-collections"
import { cn } from "@lib/util/cn"
import { getImageUrl } from "@lib/util/get-image-url"

type ExclusiveCollectionsProps = {
  items: ExclusiveCollectionEntry[]
}

const FALLBACK_POSTER = "/assets/images/slider_default.png"

const resolvePosterSource = (entry: ExclusiveCollectionEntry) => {
  const firstImage = entry.product?.images?.[0]
  return (
    entry.poster_url ??
    entry.product?.thumbnail ??
    (firstImage ? getImageUrl(firstImage) : null) ??
    FALLBACK_POSTER
  )
}

const resolveProductImageSource = (entry: ExclusiveCollectionEntry) => {
  const firstImage = entry.product?.images?.[0]
  return (
    (firstImage ? getImageUrl(firstImage) : null) ??
    entry.product?.thumbnail ??
    entry.poster_url ??
    FALLBACK_POSTER
  )
}

const resolveDisplayPrice = (entry: ExclusiveCollectionEntry): DisplayPrice | null => {
  if (!entry.product) {
    return null
  }

  try {
    const { cheapestPrice } = getProductPrice({ product: entry.product })
    return buildDisplayPrice(cheapestPrice)
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Unable to compute price for exclusive entry", error)
    }
    return null
  }
}

const PriceStack = ({ price }: { price: DisplayPrice | null }) => {
  if (!price) {
    return null
  }

  return (
    <div className="flex flex-col leading-tight">
      <p
        className={cn("text-sm font-semibold", {
          "text-[#E7353A]": price.isDiscounted,
          "text-[#4b2b1c]": !price.isDiscounted,
        })}
      >
        {price.current.raw}
      </p>
      {price.original && (
        <p className="text-xs text-[#9c7e6f] line-through">{price.original.raw}</p>
      )}
    </div>
  )
}

const ExclusiveCollections = ({ items }: ExclusiveCollectionsProps) => {
  const [isMounted, setIsMounted] = useState(false)
  const swiperRef = useRef<SwiperInstance | null>(null)
  const [isAutoplaying, setIsAutoplaying] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)

  const showcaseItems = useMemo(() => items ?? [], [items])
  const hasItems = showcaseItems.length > 0
  const shouldLoop = showcaseItems.length > 5

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!hasItems) {
    return null
  }

  return (
    <section className="w-full bg-[#eeffd2]">
      <div className="mx-auto max-w-screen-2xl px-4 py-12 md:py-16">
        <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b26f45]">
              Exclusive collections
            </p>
            <h2 className="mt-2 text-3xl font-bold text-[#4b2b1c] md:text-4xl">
              Limited-edition playtime drops
            </h2>
            <p className="mt-2 max-w-2xl text-base text-[#725747]">
              Catch our toymakers showcasing each collectible live, note the magic code, and
              claim your next adventure set before the sparkly stock disappears.
            </p>
          </div>
        </header>

        {!isMounted ? (
          <div className="grid gap-4 rounded-xl bg-[#f8ede6] p-6 sm:grid-cols-2 lg:grid-cols-3">
            {showcaseItems.slice(0, 3).map((item) => {
              const title = item.product?.title ?? "Featured collectible"
              const productImage = resolveProductImageSource(item)
              const displayPrice = resolveDisplayPrice(item)

              return (
                <article key={item.id} className="flex flex-col rounded-xl bg-white/80 p-4 shadow-sm">
                  <div className="relative mb-4 h-40 w-full overflow-hidden rounded-lg">
                    {productImage ? (
                      <Image
                        src={productImage}
                        alt={title}
                        fill
                        sizes="(min-width: 1024px) 360px, 100vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-[#f2dccd]" aria-hidden="true" />
                    )}
                  </div>
                  <p className="text-base font-semibold text-[#4b2b1c]">{title}</p>
                  <PriceStack price={displayPrice} />
                </article>
              )
            })}
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-xl">
            <Swiper
              modules={[Autoplay]}
              loop={shouldLoop}
              speed={600}
              spaceBetween={16}
              slidesPerView={1}
              breakpoints={{
                540: {
                  slidesPerView: 1,
                },
                768: {
                  slidesPerView: 2,
                },
                1024: {
                  slidesPerView: 3,
                },
                1280: {
                  slidesPerView: 5.25,
                },
              }}
              autoplay={{
                delay: 4500,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              onSwiper={(swiper) => {
                swiperRef.current = swiper
              }}
              onSlideChange={(swiper) => {
                setActiveIndex(swiper.realIndex)
              }}
              className="exclusive-swiper pb-6"
              aria-roledescription="Exclusive collections slider"
            >
              {showcaseItems.map((item, index) => {
                const poster = resolvePosterSource(item)
                const productImage = resolveProductImageSource(item)
                const title = item.product?.title ?? "Exclusive collectible"
                const productHandle = item.product?.handle ?? item.product_id
                const displayPrice = resolveDisplayPrice(item)
                const hasVideo = Boolean(item.video_url && item.video_url.trim().length > 0)

                return (
                  <SwiperSlide
                    key={item.id}
                    role="group"
                    aria-label={`Video ${index + 1} of ${showcaseItems.length}`}
                  >
                    <article className="flex h-full flex-col rounded-xl overflow-hidden bg-black">
                      <div className="relative overflow-hidden rounded-xl h-[400px]">
                        {hasVideo ? (
                          <video
                            className="h-full w-full object-cover d-block"
                            src={item.video_url}
                            autoPlay
                            loop
                            muted
                            playsInline
                            preload="metadata"
                            poster={poster}
                          >
                            Your browser does not support the video tag.
                          </video>
                        ) : (
                          <Image
                            src={poster}
                            alt={title}
                            fill
                            className="object-cover"
                            sizes="(min-width: 1024px) 360px, 100vw"
                          />
                        )}
                        <LocalizedClientLink
                          href={`/products/${productHandle}`}
                          className="absolute bottom-0 left-0 right-0 flex items-center gap-3 bg-[#dbfca7] p-3 text-[#3a5017] z-10 transition-transform hover:-translate-y-1"
                        >
                          <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-white/60 shrink-0">
                            {productImage ? (
                              <Image
                                src={productImage}
                                alt={title}
                                fill
                                sizes="64px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="h-full w-full bg-white/40" aria-hidden="true" />
                            )}
                          </div>
                          <div className="flex min-h-[3.5rem] flex-1 flex-col justify-center overflow-hidden">
                            <p className="text-sm font-semibold leading-tight truncate">{title}</p>
                            <PriceStack price={displayPrice} />
                          </div>
                        </LocalizedClientLink>
                      </div>
                    </article>
                  </SwiperSlide>
                )
              })}
            </Swiper>
            <button
              type="button"
              className="exclusive-nav-button absolute left-2 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-900 shadow-sm transition hover:bg-gray-50"
              aria-label="Previous video"
              onClick={() => swiperRef.current?.slidePrev()}
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="exclusive-nav-button absolute right-2 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-900 shadow-sm transition hover:bg-gray-50"
              aria-label="Next video"
              onClick={() => swiperRef.current?.slideNext()}
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

export default ExclusiveCollections