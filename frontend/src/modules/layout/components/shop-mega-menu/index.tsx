"use client"

import { KeyboardEvent } from "react"
import Image from "next/image"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import type { ShopMenuPromo, ShopMenuSection } from "@modules/layout/config/navigation"

type ShopMegaMenuProps = {
  sections: ShopMenuSection[]
  promo: ShopMenuPromo
  isOpen: boolean
  offsetLeft?: number
  onMouseEnter: () => void
  onMouseLeave: () => void
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void
}

const basePanelClasses =
  "rounded-2xl p-4"

const ShopMegaMenu = ({
  sections,
  promo,
  isOpen,
  offsetLeft = 0,
  onMouseEnter,
  onMouseLeave,
  onKeyDown,
}: ShopMegaMenuProps) => {
  const adjustedLeft = Number.isFinite(offsetLeft) ? Math.max(0, offsetLeft) : 0

  return (
    <div
      role="region"
      aria-label="Shop menu"
      className={`absolute left-0 top-[calc(100%+0rem)] z-20 w-[min(850px,92vw)] rounded-br-xl rounded-bl-xl border border-gray-200/70 bg-white/95 backdrop-blur transition-all duration-200 ease-out ${
        isOpen
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0"
      }`}
      style={{ left: `-${adjustedLeft}px` }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onKeyDown={onKeyDown}
    >
      <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-[repeat(3,minmax(0,1fr))]">
        {sections.map((section) => (
          <div
            key={section.id}
            className={`${
              section.accent === "muted" ? "bg-sky-50" : "bg-white"
            } ${basePanelClasses}`}
          >
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              {section.title}
            </p>
            <ul className="mt-3 space-y-2">
              {section.items.map((item) => (
                <li key={item.id}>
                  <LocalizedClientLink
                    href={item.href}
                    prefetchIntent="hover"
                    className="text-base font-medium text-slate-900 transition-colors duration-150 hover:text-primary"
                  >
                    {item.label}
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className={`${basePanelClasses} bg-rose-50`}
          aria-label="Promoted collections"
        >
          <div className="space-y-3">
            {promo.links.map((link, index) => {
              if (index === 0) {
                return (
                  <LocalizedClientLink
                    key={link.id}
                    href={link.href}
                    prefetchIntent="hover"
                    className="inline-flex w-full items-center justify-center rounded-full bg-primary px-4 py-2 text-base font-semibold text-white shadow-sm transition hover:bg-primary/90"
                  >
                    {link.label}
                  </LocalizedClientLink>
                )
              }

              return (
                <LocalizedClientLink
                  key={link.id}
                  href={link.href}
                  prefetchIntent="hover"
                  className="block text-base font-medium text-slate-900 transition-colors hover:text-primary"
                >
                  {link.label}
                </LocalizedClientLink>
              )
            })}
          </div>

          <LocalizedClientLink
            href="/products/dj-coco-light-music-toy"
            prefetchIntent="hover"
            className="mt-6 block overflow-hidden rounded-2xl bg-white/70 p-3 text-center shadow-inner transition hover:bg-white"
            aria-label="View DJ Coco Light Music Toy"
          >
            <div className="relative mx-auto h-32 w-full max-w-[160px]">
              <Image
                src={promo.image.src}
                alt={promo.image.alt}
                fill
                sizes="(max-width: 1024px) 50vw, 160px"
                className="object-contain"
                priority={false}
              />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-800">
              Dj Coco Light & Music Toy
            </p>
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}

export default ShopMegaMenu
