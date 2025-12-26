"use client"

import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import type { Swiper as SwiperInstance } from "swiper/types"
import { FreeMode, Navigation, Thumbs } from "swiper/modules"
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react"

import Modal from "@modules/common/components/modal"

import "swiper/css"
import "swiper/css/free-mode"
import "swiper/css/navigation"
import "swiper/css/thumbs"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
  variant?: "default" | "modal"
}

const ImageGallery = ({ images, variant = "default" }: ImageGalleryProps) => {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperInstance | null>(null)
  const [mainSwiper, setMainSwiper] = useState<SwiperInstance | null>(null)
  const [zoomSwiper, setZoomSwiper] = useState<SwiperInstance | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [zoomIndex, setZoomIndex] = useState(0)
  const [isMounted, setIsMounted] = useState(false)
  const [isZoomOpen, setIsZoomOpen] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    setActiveIndex(0)
    if (mainSwiper) {
      mainSwiper.slideTo(0)
    }
  }, [images, mainSwiper])

  const safeThumbs = useMemo(() => {
    if (!thumbsSwiper || thumbsSwiper.destroyed) {
      return null
    }
    return thumbsSwiper
  }, [thumbsSwiper])

  const currentImage = images[activeIndex]

  const showThumbs = variant === "default"
  const showZoom = variant === "default"
  const containerClassName = variant === "default"
    ? "flex w-full flex-col gap-4 lg:flex-row lg:gap-6"
    : "flex w-full flex-col gap-4"
  const mainWrapperClassName = variant === "default"
    ? "relative flex-1 overflow-hidden rounded-xl"
    : "relative overflow-hidden"
  const mainImageClassName = variant === "default"
    ? "relative aspect-[4/4.4] w-full overflow-hidden rounded-xl bg-white"
    : "relative aspect-[4/4.4] w-full overflow-hidden bg-white md:aspect-square"

  const handleZoom = () => {
    if (!currentImage?.url) return
    setZoomIndex(activeIndex)
    setIsZoomOpen(true)
  }

  const closeZoom = () => setIsZoomOpen(false)

  useEffect(() => {
    if (!isZoomOpen || !zoomSwiper) return
    const target = Math.min(zoomIndex, images.length - 1)
    zoomSwiper.slideTo(target, 0)
    zoomSwiper.update()
  }, [isZoomOpen, zoomSwiper, zoomIndex, images.length])

  if (!images?.length) {
    return (
      <div className="flex w-full flex-col gap-4">
        <div className="flex h-[420px] w-full items-center justify-center rounded-3xl border border-dashed border-ui-border-base text-sm text-ui-fg-muted">
          Images coming soon
        </div>
      </div>
    )
  }

  if (!isMounted) {
    const firstImage = images[0]
    return (
      <div className="flex flex-col gap-4">
        <div className="relative h-[420px] w-full overflow-hidden rounded-3xl bg-ui-bg-subtle">
          {firstImage?.url && (
            <Image
              src={firstImage.url}
              alt="Primary product image"
              fill
              priority
              sizes="(min-width: 1024px) 620px, 100vw"
              className="object-cover"
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={containerClassName}>
      {showThumbs && (
        <div className="hidden w-[80px] flex-col lg:flex">
          <div className="bg-white/90">
          <Swiper
            direction="vertical"
            modules={[FreeMode, Thumbs]}
            spaceBetween={0}
            slidesPerView={Math.min(images.length, 5)}
            freeMode
            slideToClickedSlide
            watchSlidesProgress
            onSwiper={(swiperInstance) => setThumbsSwiper(swiperInstance)}
            className="product-thumb-swiper"
          >
            {images.map((image, index) => (
              <SwiperSlide key={image.id ?? index} className="!h-24">
                <button
                  type="button"
                  onClick={() => mainSwiper?.slideTo(index)}
                  className={`group relative flex h-[80px] w-full items-center justify-center overflow-hidden rounded-xl border bg-[#FBFBFB] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7353A]/60 ${
                    activeIndex === index
                      ? "border-[#E7353A]"
                      : "border-transparent"
                  }`}
                >
                  <ImageThumb image={image} index={index} />
                </button>
              </SwiperSlide>
            ))}
          </Swiper>
          </div>
        </div>
      )}

      <div className={mainWrapperClassName}>
        <Swiper
          modules={showThumbs ? [Navigation, Thumbs] : [Navigation]}
          navigation={{
            nextEl: ".product-gallery-next",
            prevEl: ".product-gallery-prev",
          }}
          spaceBetween={24}
          thumbs={showThumbs ? { swiper: safeThumbs } : undefined}
          className="product-main-swiper"
          onSwiper={(swiperInstance) => setMainSwiper(swiperInstance)}
          onSlideChange={(swiperInstance) =>
            setActiveIndex(swiperInstance.activeIndex ?? 0)
          }
        >
          {images.map((image, index) => (
            <SwiperSlide key={image.id ?? index}>
              <div className={mainImageClassName}>
                {image.url ? (
                  <Image
                    src={image.url}
                    alt={`Product image ${index + 1}`}
                    fill
                    priority={index === 0}
                    sizes="(min-width: 1024px) 620px, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-ui-bg-subtle" />
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {showZoom && (
          <button
            type="button"
            onClick={handleZoom}
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-ui-fg-base shadow-md transition hover:scale-105"
            aria-label="Open image zoom"
          >
            <Maximize2 className="h-5 w-5" />
          </button>
        )}

        <button
          type="button"
          className="product-gallery-prev absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-ui-border-base bg-ui-bg-base text-ui-fg-base shadow-sm transition hover:bg-ui-bg-subtle"
          aria-label="Previous image"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="product-gallery-next absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-ui-border-base bg-ui-bg-base text-ui-fg-base shadow-sm transition hover:bg-ui-bg-subtle"
          aria-label="Next image"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {showThumbs && (
        <div className="block w-full lg:hidden">
          <Swiper
            modules={[FreeMode, Thumbs]}
            spaceBetween={12}
            slidesPerView={4.2}
            freeMode
            className="product-thumb-swiper-mobile"
          >
            {images.map((image, index) => (
              <SwiperSlide key={(image.id ?? index) + "-mobile"}>
                <button
                  type="button"
                  onClick={() => mainSwiper?.slideTo(index)}
                  className={`relative h-20 w-full overflow-hidden rounded-2xl border ${
                    activeIndex === index ? "border-[#E7353A]" : "border-transparent"
                  }`}
                  aria-label={`Show image ${index + 1}`}
                >
                  <ImageThumb image={image} index={index} />
                </button>
              </SwiperSlide>
            ))}
          </Swiper>

        <Modal isOpen={isZoomOpen} close={closeZoom} size="xlarge" fullScreen>
          <div className="relative flex h-full w-full items-center justify-center bg-white">
            <button
              type="button"
              onClick={closeZoom}
              className="absolute right-4 top-4 z-20 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-ui-fg-base border "
              aria-label="Close zoomed image"
            >
              <X className="h-5 w-5" />
            </button>

            <Swiper
              modules={[Navigation]}
              navigation={false}
              initialSlide={zoomIndex}
              onSwiper={setZoomSwiper}
              onSlideChange={(swiperInstance) => {
                const nextIndex = swiperInstance.activeIndex ?? 0
                setZoomIndex(nextIndex)
              }}
              className="product-zoom-swiper h-full w-full"
              spaceBetween={0}
            >
              {images.map((image, index) => (
                <SwiperSlide key={(image.id ?? index) + "-zoom"}>
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="relative h-full w-full max-h-screen max-w-screen overflow-hidden bg-white">
                      {image.url ? (
                        <Image
                          src={image.url}
                          alt={`Zoomed product image ${index + 1}`}
                          fill
                          sizes="100vw"
                          className="object-contain"
                          priority={index === zoomIndex}
                        />
                      ) : (
                        <div className="h-full w-full bg-ui-bg-subtle" />
                      )}
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full bg-white/95 px-4 py-2 text-sm text-ui-fg-base shadow-md">
              <button
                type="button"
                onClick={() => zoomSwiper?.slidePrev()}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-ui-bg-subtle transition"
                aria-label="Previous zoomed image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="min-w-[60px] text-center text-base font-medium">
                {zoomIndex + 1} / {images.length}
              </span>
              <button
                type="button"
                onClick={() => zoomSwiper?.slideNext()}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-ui-bg-subtle transition"
                aria-label="Next zoomed image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </Modal>
        </div>
      )}
    </div>
  )
}

const ImageThumb = ({
  image,
  index,
}: {
  image: HttpTypes.StoreProductImage
  index: number
}) => {
  return (
    <>
      {image.url ? (
        <Image
          src={image.url}
          alt={`Thumbnail ${index + 1}`}
          fill
          sizes="120px"
          className="object-cover"
        />
      ) : (
        <div className="h-full w-full bg-ui-bg-subtle" />
      )}
    </>
  )
}

export default ImageGallery
