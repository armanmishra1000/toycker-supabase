"use client"

import { useCallback } from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"

interface AnnouncementMessage {
  id: string
  text: string
}

const AnnouncementBar = () => {
  // All promotional messages shown to everyone
  const messages: AnnouncementMessage[] = [
    {
      id: "delivery",
      text: "FREE Home Delivery on Orders Above ₹500"
    },
    {
      id: "discount",
      text: "Get instant 5% discount on online payment"
    },
    {
      id: "club-discount",
      text: "Club Members Get 5% OFF on all products"
    },
    {
      id: "club-rewards",
      text: "Club Members Earn 5% Reward Points"
    }
  ]

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "center"
    },
    [
      Autoplay({
        delay: 5000,
        stopOnInteraction: false
      })
    ]
  )

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  return (
    <div
      role="region"
      aria-label="Announcement bar"
      aria-live="polite"
      className="hidden lg:block bg-foreground text-white py-3"
    >
      <div className="mx-auto px-4 max-w-[1440px]">
        <div className="flex items-center justify-center">
          {/* Previous Arrow - positioned closer to content */}
          <button
            onClick={scrollPrev}
            aria-label="Previous announcement"
            className="flex items-center justify-center hover:opacity-80 transition-opacity mr-3"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>

          {/* Carousel Container */}
          <div className="overflow-hidden max-w-xl" ref={emblaRef}>
            <div className="flex">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className="flex-[0_0_100%] min-w-0"
                >
                  <div className="text-center">
                    <span className="text-base font-medium">
                      {message.text}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Arrow - positioned closer to content */}
          <button
            onClick={scrollNext}
            aria-label="Next announcement"
            className="flex items-center justify-center hover:opacity-80 transition-opacity ml-3"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default AnnouncementBar