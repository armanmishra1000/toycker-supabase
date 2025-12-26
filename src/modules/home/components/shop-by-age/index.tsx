"use client"

import Link from "next/link"
import { Swiper, SwiperSlide } from "swiper/react"
import { Pagination } from "swiper/modules"

import "swiper/css"
import "swiper/css/pagination"

type AgeGroup = {
  id: string
  title: string
  subtitle: string
  baseColorClass: string
  hoverColorClass: string
}

const AGE_GROUPS: AgeGroup[] = [
  {
    id: "0-18-months",
    title: "0–18",
    subtitle: "months",
    baseColorClass: "text-[#9ce6e3]",
    hoverColorClass: "group-hover:text-[#00B7B1]",
  },
  {
    id: "18-36-months",
    title: "18–36",
    subtitle: "months",
    baseColorClass: "text-[#ffc7e8]",
    hoverColorClass: "group-hover:text-[#FF2FA3]",
  },
  {
    id: "3-5-years",
    title: "3–5",
    subtitle: "years",
    baseColorClass: "text-[#b8f3cf]",
    hoverColorClass: "group-hover:text-[#00A651]",
  },
  {
    id: "5-7-years",
    title: "5–7",
    subtitle: "years",
    baseColorClass: "text-[#ffb7bd]",
    hoverColorClass: "group-hover:text-[#FF4B5C]",
  },
  {
    id: "7-9-years",
    title: "7–9",
    subtitle: "years",
    baseColorClass: "text-[#a3d9ff]",
    hoverColorClass: "group-hover:text-[#0072BC]",
  },
  {
    id: "9-12-years",
    title: "9–12",
    subtitle: "years",
    baseColorClass: "text-[#ffd9a5]",
    hoverColorClass: "group-hover:text-[#FF9900]",
  },
  {
    id: "12-14-years",
    title: "12–14",
    subtitle: "years",
    baseColorClass: "text-[#d7bae7]",
    hoverColorClass: "group-hover:text-[#9B59B6]",
  },
  {
    id: "14-plus-years",
    title: "14+",
    subtitle: "years",
    baseColorClass: "text-[#a2e8db]",
    hoverColorClass: "group-hover:text-[#16A085]",
  },
]

type AgeStarProps = AgeGroup

const AgeStar = ({ id, title, subtitle, baseColorClass, hoverColorClass }: AgeStarProps) => {
  return (
    <Link
      href={`/collections/${id}`}
      className="group flex min-w-[6rem] md:min-w-[10rem] flex-col items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ui-border-strong"
      aria-label={`${title} ${subtitle}`}
    >
      <div className="relative h-24 w-24 md:h-36 md:w-36">
        <svg
          width="153"
          height="150"
          viewBox="0 0 153 150"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className={`h-full w-full transition duration-200 ease-out ${baseColorClass} ${hoverColorClass} group-hover:-rotate-6`}
        >
          <path
            d="M122.599 42.1969C114.229 41.8725 107.392 35.1248 107.009 26.6254C106.498 15.4659 102.983 2.23015 89.4374 0.218833C75.1247 -1.85736 65.9876 11.2486 60.9398 22.2135C57.2977 30.129 49.2468 34.9302 40.6848 34.4111C26.2443 33.5677 6.05318 34.9302 1.06929 48.0362C-3.46732 59.8445 7.2672 72.0422 17.5544 80.4118C25.6053 87.0297 28.3529 98.319 24.3274 107.986C19.0879 120.638 15.957 136.923 29.7586 143.606C43.5601 150.289 57.4255 140.881 66.6904 131.603C73.08 125.245 83.3672 125.374 89.5651 131.992C99.5968 142.633 114.101 154.506 125.027 148.277C135.954 142.049 133.078 125.05 128.925 112.333C125.986 103.25 128.669 93.2583 135.762 86.9648C144.963 78.7898 155.25 66.9166 152.567 56.2112C149.947 45.4409 134.931 42.651 122.599 42.1969Z"
            fill="currentColor"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-black transition-colors duration-200 group-hover:text-white">
          <span className="text-base font-semibold leading-tight md:text-lg">
            {title}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide md:text-sm">
            {subtitle}
          </span>
        </div>
      </div>
    </Link>
  )
}

const ShopByAge = () => {
  return (
    <section className="w-full bg-ui-bg-base">
      <div className="mx-auto max-w-screen-2xl px-4 py-16">
        <header className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-ui-fg-muted">
            Find the perfect toy
          </p>
          <h2 className="mt-2 text-3xl font-bold text-ui-fg-base md:text-4xl">
            Shop by Age
          </h2>
        </header>

        <Swiper
          modules={[Pagination]}
          pagination={{
            clickable: true,
            bulletClass:
              "swiper-pagination-bullet bg-gray-300 opacity-100 transition [margin-inline:6px]",
            bulletActiveClass:
              "swiper-pagination-bullet-active bg-primary",
          }}
          spaceBetween={32}
          slidesPerView={2}
          breakpoints={{
            480: { slidesPerView: 3 },
            768: { slidesPerView: 4 },
            1024: { slidesPerView: 5 },
            1280: { slidesPerView: 6 },
            1440: { slidesPerView: 6 },
          }}
          className="pb-12 [--swiper-pagination-bottom:-0.5rem]"
        >
          {AGE_GROUPS.map((group) => (
            <SwiperSlide key={group.id} className="flex justify-center py-4">
              <AgeStar {...group} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  )
}

export default ShopByAge
