"use client"

import { LayoutGrid, PanelsTopLeft } from "lucide-react"
import { clx } from "@medusajs/ui"
import type { ComponentType } from "react"
import type { CatalogViewMode } from "@modules/catalog/types"

type CatalogViewToggleProps = {
  value: CatalogViewMode
  onChange: (value: CatalogViewMode) => void
}

const MODES: { value: CatalogViewMode; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { value: "grid-4", label: "4 column", icon: LayoutGrid },
  { value: "grid-5", label: "5 column", icon: PanelsTopLeft },
]

const CatalogViewToggle = ({ value, onChange }: CatalogViewToggleProps) => {
  return (
    <div className="inline-flex items-center gap-2 rounded-3xl border border-slate-200 bg-white/80 p-1 text-xs font-semibold text-slate-600">
      {MODES.map((mode) => {
        const Icon = mode.icon
        const isActive = mode.value === value
        return (
          <button
            type="button"
            key={mode.value}
            aria-pressed={isActive}
            onClick={() => onChange(mode.value)}
            className={clx(
              "flex items-center gap-2 rounded-3xl px-3 py-1.5 transition",
              isActive ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {mode.label}
          </button>
        )
      })}
    </div>
  )
}

export default CatalogViewToggle
