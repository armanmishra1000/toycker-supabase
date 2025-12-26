"use client"

import { Home } from "lucide-react"
import { clx } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import type { ReactNode } from "react"

type BreadcrumbItem = {
  label: string
  href?: string
}

type BreadcrumbsProps = {
  items: BreadcrumbItem[]
  className?: string
  homeLabel?: ReactNode
}

const Breadcrumbs = ({ items, className, homeLabel = "Home" }: BreadcrumbsProps) => (
  <nav aria-label="Breadcrumb" className={clx("text-sm text-slate-500", className)}>
    <ol className="flex flex-wrap items-center gap-1.5">
      <li className="inline-flex items-center gap-1">
        <LocalizedClientLink
          href="/"
          className="inline-flex items-center gap-1 rounded-full border border-transparent px-2 py-1 text-slate-600 transition hover:border-slate-200 hover:bg-white hover:text-slate-900"
        >
          <Home className="h-4 w-4" aria-hidden />
          <span className="sr-only">Home</span>
          <span className="hidden text-xs font-semibold uppercase tracking-[0.25em] sm:inline">{homeLabel}</span>
        </LocalizedClientLink>
      </li>
      {items.map((item, index) => (
        <li key={`${item.label}-${index}`} className="flex items-center gap-1 text-xs font-medium uppercase tracking-[0.3em] text-slate-500">
          <span className="text-slate-300">/</span>
          {item.href ? (
            <LocalizedClientLink
              href={item.href}
              className="rounded-full border border-transparent px-2 py-1 text-slate-500 transition hover:border-slate-200 hover:bg-white hover:text-slate-900"
            >
              {item.label}
            </LocalizedClientLink>
          ) : (
            <span className="px-2 py-1 text-slate-700">{item.label}</span>
          )}
        </li>
      ))}
    </ol>
  </nav>
)

export default Breadcrumbs
