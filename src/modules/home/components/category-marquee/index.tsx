"use client"

import Link from "next/link"
import { Fragment, useMemo, useState, type MouseEvent, type FocusEvent } from "react"

type CategoryItem = {
  id: string
  label: string
  slug: string
}

type MarqueeItem = CategoryItem & {
  isDuplicate: boolean
}

const CATEGORY_ITEMS: CategoryItem[] = [
  {
    id: "bath-toys",
    label: "Bath Toys",
    slug: "bath-toys",
  },
  {
    id: "/toys-games",
    label: "Toys & Games",
    slug: "/toys-games",
  },
  {
    id: "sporting-goods",
    label: "Sporting Goods",
    slug: "sporting-goods",
  },
  {
    id: "home-garden",
    label: "Home & Garden",
    slug: "home-garden",
  },
  {
    id: "riding-toys",
    label: "Riding Toys",
    slug: "riding-toys",
  },
  {
    id: "inline-roller-skating",
    label: "Inline & Roller Skating",
    slug: "inline-roller-skating",
  },
  {
    id: "games",
    label: "Games",
    slug: "games",
  },
  {
    id: "office-supplie",
    label: "Office Supplie",
    slug: "office-supplie",
  },
  {
    id: "toys",
    label: "Toys",
    slug: "toys",
  },
  {
    id: "arts-entertainment",
    label: "Arts & Entertainment",
    slug: "arts-entertainment",
  },
  {
    id: "clothing-accessories",
    label: "Clothing Accessories",
    slug: "clothing-accessories",
  },
  {
    id: "play-vehicles",
    label: "Play Vehicles",
    slug: "play-vehicles",
  },
  {
    id: "puzzles",
    label: "Puzzles",
    slug: "puzzles",
  },
  {
    id: "alphabet-toys",
    label: "Alphabet Toys",
    slug: "alphabet-toys",
  },
  {
    id: "musical-toys",
    label: "Musical Toy",
    slug: "musical-toys",
  },
]

const StarSeparator = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 35 32"
    className="h-5 w-5 text-[#ff2041] sm:h-6 sm:w-6"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M33.3,6.9c-0.9-0.3-1.9,0-2.9,0.1c-1,0.2-2,0.4-3,0.6C26,8,24.5,8.4,23.1,8.9c0-0.1-0.1-0.2-0.1-0.4c-0.5-1.1-1.1-2.2-1.7-3.3c-0.2-0.3-0.3-0.6-0.5-1c-0.1-0.2-0.2-0.4-0.4-0.6c-0.6-1-1.2-2-2-2.8C18,0.5,17.5,0.1,16.9,0c-0.5-0.1-0.9,0-1.2,0.2C15,0.5,14.5,1,14.1,1.6C13.4,3,12.9,4.5,12.5,6c-0.4,1.4-0.7,2.8-0.8,4.2l-0.2,0.6c-1.6,0.3-3.3,0.5-4.9,0.8C5,12,3,12,1.6,12.9c-1.4,0.9-2.2,2.8-1.2,4.3c0.8,1.4,2.7,1.7,4.1,2.2c0.8,0.3,1.6,0.5,2.5,0.8c0.4,0.1,0.8,0.2,1.2,0.4c0.2,0.1,0.5,0.2,0.7,0.2c-0.1,0.8,0.3,4.7,0.3,5.1c0.2,1.5,0.3,3.3,1.1,4.6c0.8,1.4,2.4,2,3.8,1.1c0.8-0.5,1.4-1.3,1.9-2.1c0.5-0.7,1-1.5,1.4-2.3c0.5-0.9,0.9-1.8,1.3-2.7c0.6,0.9,1.2,1.7,1.8,2.6c1,1.4,2.3,2.6,4.1,2.5c1.9-0.2,2.9-1.9,2.7-3.7c-0.2-1.9-0.6-3.8-0.9-5.8c-0.1-0.9-0.2-1.8-0.4-2.6c-0.1-0.2-0.2-0.2,0.1-0.3c0.4-0.2,0.8-0.3,1.2-0.5c1.4-0.6,2.9-1.3,4.1-2.2c1.2-0.9,2.4-2.1,3.1-3.5C35.3,9.6,35.2,7.5,33.3,6.9z" />
  </svg>
)

const CategoryMarquee = () => {
  const [isPaused, setIsPaused] = useState(false)

  const marqueeItems = useMemo<MarqueeItem[]>(() => {
    const runs: MarqueeItem[] = []

    for (let passIndex = 0; passIndex < 2; passIndex += 1) {
      CATEGORY_ITEMS.forEach((item) => {
        runs.push({
          ...item,
          isDuplicate: passIndex === 1,
        })
      })
    }

    return runs
  }, [])

  const handlePreview = (
    event: MouseEvent<HTMLAnchorElement> | FocusEvent<HTMLAnchorElement>,
  ) => {
    setIsPaused(true)
  }

  const clearPreview = () => {
    setIsPaused(false)
  }

  return (
    <section className="bg-[#cfbfff] md:py-10 py-4" aria-label="Category highlights marquee">
      <div className="w-full overflow-hidden">
        <div
          className="category-marquee-track flex w-max items-center text-lg font-semibold text-white sm:text-xl animate-category-marquee"
          style={{ animationPlayState: isPaused ? "paused" : "running" }}
        >
          {marqueeItems.map((item, index) => (
            <Fragment key={`${item.id}-${index}`}>
              <Link
                href={`/categories/${item.slug}`}
                className="flex items-center gap-3 whitespace-nowrap px-4 text-black transition-colors hover:text-[#5921ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                onMouseEnter={handlePreview}
                onFocus={handlePreview}
                onMouseLeave={clearPreview}
                onBlur={clearPreview}
                aria-hidden={item.isDuplicate}
                tabIndex={item.isDuplicate ? -1 : undefined}
              >
                {item.label}
              </Link>
              <StarSeparator />
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CategoryMarquee
