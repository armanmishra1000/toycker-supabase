"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import Image from "next/image"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { ChevronLeft, ChevronRight } from "lucide-react"

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
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const poster = resolvePosterSource(item)
  const productImage = resolveProductImageSource(item)
  const title = item.product?.name ?? "Exclusive collectible"
  const productHandle = item.product?.handle ?? item.product_id
  const { displayPrice, clubPrice } = resolveDisplayPrice(item, clubDiscountPercentage)
  const hasVideo = Boolean(item.video_url && item.video_url.trim().length > 0)

  // Show skeleton until both data and media are ready
  if (!isLoaded) {
    return (
      <div className="relative">
        <ExclusiveCardSkeleton />
        <div className="invisible absolute inset-0 -z-50 size-0 overflow-hidden">
          {hasVideo ? (
            <video
              src={item.video_url}
              preload="auto"
              onLoadedData={() => setIsLoaded(true)}
              onCanPlay={() => setIsLoaded(true)}
            />
          ) : (
            <Image
              src={poster}
              alt={title}
              width={400}
              height={400}
              onLoad={() => setIsLoaded(true)}
            />
          )}
        </div>
      </div>
    )
  }

  // Show actual content only when loaded
  return (
    <article className="flex h-full flex-col rounded-xl overflow-hidden bg-white shadow-sm border border-black/5">
      <div className="relative overflow-hidden flex-1 min-h-[320px]">
        {hasVideo ? (
          <video
            className="h-full w-full object-cover block"
            src={item.video_url}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
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
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 20vw"
          />
        )}
      </div>
      <LocalizedClientLink
        href={`/products/${productHandle}`}
        className="flex items-center gap-3 bg-[#dbfca7] p-4 text-[#3a5017] hover:bg-[#cff798] transition-colors"
      >
        <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-white/60 shrink-0">
          {productImage ? (
            <Image
              src={productImage}
              alt={title}
              fill
              sizes="56px"
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-white/40" aria-hidden="true" />
          )}
        </div>
        <div className="flex flex-1 flex-col justify-center overflow-hidden min-w-0">
          <p className="text-sm font-bold leading-tight truncate">{title}</p>
          <PriceStack price={displayPrice} clubPrice={clubPrice} />
        </div>
      </LocalizedClientLink>
    </article>
  )
}

const ExclusiveCollections = ({ items, clubDiscountPercentage }: ExclusiveCollectionsProps) => {
  const [isMounted, setIsMounted] = useState(false)

  const showcaseItems = useMemo(() => items ?? [], [items])
  const hasItems = showcaseItems.length > 0
  const shouldLoop = showcaseItems.length > 5

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: shouldLoop,
      align: "start",
      skipSnaps: false,
    },
    [
      Autoplay({
        delay: 4500,
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
          <div className="relative group">
            <div className="overflow-hidden rounded-xl" ref={emblaRef}>
              <div className="flex -ml-4">
                {showcaseItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex-[0_0_100%] pl-4 min-w-0 md:flex-[0_0_50%] lg:flex-[0_0_33.333%] xl:flex-[0_0_19%] py-4"
                    role="group"
                    aria-label={`Video ${index + 1} of ${showcaseItems.length}`}
                  >
                    <ExclusiveCard
                      item={item}
                      clubDiscountPercentage={clubDiscountPercentage}
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={scrollPrev}
              className={cn(
                "absolute left-2 md:left-4 top-1/2 size-9 md:size-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-900 shadow-sm transition-all z-30 hover:bg-gray-50 flex",
                !canScrollPrev && "opacity-50 cursor-not-allowed"
              )}
              aria-label="Previous video"
            >
              <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={scrollNext}
              className={cn(
                "absolute right-2 md:right-4 top-1/2 size-9 md:size-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-900 shadow-sm transition-all z-30 hover:bg-gray-50 flex",
                !canScrollNext && "opacity-50 cursor-not-allowed"
              )}
              aria-label="Next video"
            >
              <ChevronRight className="h-4 w-4 md:h-5 md:w-5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

export default ExclusiveCollections