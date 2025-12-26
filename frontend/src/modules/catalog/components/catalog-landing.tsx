"use client"

import Breadcrumbs from "@modules/common/components/breadcrumbs"
import CatalogCardGrid from "@modules/catalog/components/catalog-card-grid"
import type { CatalogCardItem } from "@modules/catalog/types"

type CatalogLandingProps = {
  title: string
  subtitle?: string
  breadcrumbs: { label: string; href?: string }[]
  items: CatalogCardItem[]
}

const CatalogLanding = ({ title, subtitle, breadcrumbs, items }: CatalogLandingProps) => {
  return (
    <div className="mx-auto pt-4 x-4 pb-8 max-w-[1440px] space-y-6">
      <Breadcrumbs items={breadcrumbs} className="text-xs" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="text-base text-slate-500">{subtitle}</p>}
        </div>
      </div>
      <CatalogCardGrid items={items} />
    </div>
  )
}

export default CatalogLanding
