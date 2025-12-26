"use client"

import { ArrowUpRight } from "lucide-react"
import { clx } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import type { CatalogCardItem, CatalogViewMode } from "@modules/catalog/types"
import { buildPlaceholderStyles } from "@modules/catalog/utils/catalog-items"

type CatalogCardProps = {
  item: CatalogCardItem
  viewMode?: CatalogViewMode
}

const CatalogCard = ({ item, viewMode = "grid-4" }: CatalogCardProps) => {
  const hasImage = !!item.image?.src
  const imageAlt = item.image?.alt ?? `${item.title} visual`
  const aspectClass = viewMode === "grid-5" ? "aspect-square" : "aspect-[5/4]"

  return (
    <LocalizedClientLink
      href={item.href}
      className="group flex h-full flex-col overflow-hidden rounded-[32px]  bg-white/80 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className={clx("relative w-full overflow-hidden", aspectClass)}>
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image!.src}
            alt={imageAlt ?? ""}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div
            className={clx(
              "h-full w-full transition duration-500 group-hover:scale-[1.02]",
              buildPlaceholderStyles(item.id)
            )}
            aria-hidden
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            {item.badge && (
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                {item.badge}
              </p>
            )}
            <p className="text-lg font-semibold text-slate-900 line-clamp-2">
              {item.title}
            </p>
          </div>
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-900/10 bg-white text-slate-900 transition group-hover:bg-slate-900 group-hover:text-white">
            <ArrowUpRight className="h-5 w-5" aria-hidden />
          </span>
        </div>
        {item.description && (
          <p className="text-sm text-slate-500 line-clamp-2">{item.description}</p>
        )}
      </div>
    </LocalizedClientLink>
  )
}

export default CatalogCard
