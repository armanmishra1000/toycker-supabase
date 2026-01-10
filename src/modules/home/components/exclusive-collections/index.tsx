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
  clubDiscountPercentage?: number
}

const FALLBACK_POSTER = "/assets/images/slider_default.png"

const resolvePosterSource = (entry: ExclusiveCollectionEntry) => {
  const firstImage = entry.product?.images?.[0]
  return (
    entry.poster_url ??
    entry.product?.image_url ??
    (firstImage ? getImageUrl(firstImage) : null) ??
    FALLBACK_POSTER
  )
}

const resolveProductImageSource = (entry: ExclusiveCollectionEntry) => {
  const firstImage = entry.product?.images?.[0]
  return (
    (firstImage ? getImageUrl(firstImage) : null) ??
    entry.product?.image_url ??
    entry.poster_url ??
    FALLBACK_POSTER
  )
}

const resolveDisplayPrice = (entry: ExclusiveCollectionEntry, clubDiscountPercentage?: number): { displayPrice: DisplayPrice | null, clubPrice: string | null } => {
  if (!entry.product) {
    return { displayPrice: null, clubPrice: null }
  }

  try {
    const { cheapestPrice, variantPrice } = getProductPrice({
      product: entry.product,
      clubDiscountPercentage
    })

    // Choose the price object that has the club price if available
    const priceObj = variantPrice || cheapestPrice

    return {
      displayPrice: buildDisplayPrice(cheapestPrice),
      clubPrice: priceObj?.club_price ?? null
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Unable to compute price for exclusive entry", error)
    }
    return { displayPrice: null, clubPrice: null }
  }
}

const PriceStack = ({ price, clubPrice }: { price: DisplayPrice | null, clubPrice: string | null }) => {
  if (!price) {
    return null
  }

  return (
    <div className="flex flex-col leading-tight">
      <p
        className={cn("text-sm font-semibold", {
          "text-[#E7353A]": price.isDiscounted || clubPrice, // Red if discounted or club price available
          "text-[#4b2b1c]": !price.isDiscounted && !clubPrice,
        })}
      >
        {clubPrice ? (
          <span className="text-emerald-600">Club: {clubPrice}</span>
        ) : (
          price.current.raw
        )}
      </p>
      {/* Show original if discounted AND no club price, or if club price is shown then show regular as crossed out */}
      {(price.original || clubPrice) && (
        <p className="text-xs text-[#9c7e6f] line-through">
          {clubPrice ? price.current.raw : price.original?.raw}
        </p>
      )}
    </div>
  )
}

const ExclusiveCardSkeleton = () => (
  <article className="flex h-full flex-col rounded-xl overflow-hidden animate-pulse">
    <div className="relative h-[476px] w-full bg-[#e1fab8]"></div>
    <div className="flex items-center gap-3 bg-[#dbfca7] p-3 h-24">
      <div className="h-16 w-16 rounded-2xl bg-[#c8f187] shrink-0" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="h-4 w-3/4 bg-[#c8f187] rounded" />
        <div className="h-3 w-1/2 bg-[#c8f187] rounded" />
      </div>
    </div>
  </article>
)

const ExclusiveCard = ({
  item,
  clubDiscountPercentage,
}: {
  item: ExclusiveCollectionEntry
  clubDiscountPercentage?: number
  index: number
  totalItems: number
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const poster = resolvePosterSource(item)
  const productImage = resolveProductImageSource(item)
  const title = item.product?.name ?? "Exclusive collectible"
  const productHandle = item.product?.handle ?? item.product_id
  const { displayPrice, clubPrice } = resolveDisplayPrice(item, clubDiscountPercentage)
  const hasVideo = Boolean(item.video_url && item.video_url.trim().length > 0)

  return (
    <article className="flex h-full flex-col rounded-xl overflow-hidden">
      <div className="relative overflow-hidden rounded-xl">
        {!isLoaded && (
          <div className="absolute inset-0 z-20">
            <ExclusiveCardSkeleton />
          </div>
        )}

        {hasVideo ? (
          <video
            className={cn("h-full w-full object-cover d-block transition-opacity duration-300",
              isLoaded ? "opacity-100" : "opacity-0")}
            src={item.video_url}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster={poster}
            onLoadedData={() => setIsLoaded(true)}
            onCanPlay={() => setIsLoaded(true)}
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className={cn("relative h-64 w-full transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0")}>
            <Image
              src={poster}
              alt={title}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 360px, 100vw"
              onLoad={() => setIsLoaded(true)}
            />
          </div>
        )}
        <LocalizedClientLink
          href={`/products/${productHandle}`}
          className="flex items-center gap-3 bg-[#dbfca7] p-3 text-[#3a5017] z-10"
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
            <PriceStack price={displayPrice} clubPrice={clubPrice} />
          </div>
        </LocalizedClientLink>
      </div>
    </article>
  )
}

const ExclusiveCollections = ({ items, clubDiscountPercentage }: ExclusiveCollectionsProps) => {
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <ExclusiveCardSkeleton key={i} />
            ))}
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
              {showcaseItems.map((item, index) => (
                <SwiperSlide
                  key={item.id}
                  role="group"
                  aria-label={`Video ${index + 1} of ${showcaseItems.length}`}
                >
                  <ExclusiveCard
                    item={item}
                    clubDiscountPercentage={clubDiscountPercentage}
                    index={index}
                    totalItems={showcaseItems.length}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
            <button
              type="button"
              className="exclusive-nav-button absolute left-2 top-1/2 z-30 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-900 shadow-sm transition hover:bg-gray-50"
              aria-label="Previous video"
              onClick={() => swiperRef.current?.slidePrev()}
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="exclusive-nav-button absolute right-2 top-1/2 z-30 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-900 shadow-sm transition hover:bg-gray-50"
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