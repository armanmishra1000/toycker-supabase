"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ComponentType, Fragment, useId } from "react"

import { clx } from "@medusajs/ui"
import { Check, ChevronDown, LayoutGrid, PanelsTopLeft, Rows, SlidersHorizontal } from "lucide-react"
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react"

import { SORT_OPTIONS } from "@modules/store/components/refinement-list/sort-products"
import { SortOptions, ViewMode } from "@modules/store/components/refinement-list/types"
import { useOptionalStorefrontFilters } from "@modules/store/context/storefront-filters"
import { useOptionalFilterDrawer } from "@modules/store/components/filter-drawer"

type ResultsToolbarProps = {
  totalCount: number
  viewMode: ViewMode
  sortBy: SortOptions
}

const viewModes: { value: ViewMode; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { value: "grid-4", label: "4 column", icon: LayoutGrid },
  { value: "grid-5", label: "5 column", icon: PanelsTopLeft },
  { value: "list", label: "List", icon: Rows },
]

const ResultsToolbar = ({ totalCount, viewMode, sortBy }: ResultsToolbarProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const storefrontFilters = useOptionalStorefrontFilters()
  const filterDrawer = useOptionalFilterDrawer()

  const effectiveCount = storefrontFilters ? storefrontFilters.totalCount : totalCount
  const effectiveViewMode = storefrontFilters ? storefrontFilters.filters.viewMode : viewMode
  const effectiveSortBy = storefrontFilters ? storefrontFilters.filters.sortBy : sortBy

  const pushParams = (nextParams: URLSearchParams) => {
    const query = nextParams.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  const setParam = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set(name, value)
    if (name !== "page") {
      params.delete("page")
    }
    pushParams(params)
  }

  const handleViewChange = (nextMode: ViewMode) => {
    if (storefrontFilters) {
      storefrontFilters.setViewMode(nextMode)
      return
    }
    setParam("view", nextMode)
  }

  const handleSortChange = (nextSort: SortOptions) => {
    if (storefrontFilters) {
      storefrontFilters.setSort(nextSort)
      return
    }
    setParam("sortBy", nextSort)
  }

  const countText = (() => {
    const noun = effectiveCount === 1 ? "result" : "results"
    return `There ${effectiveCount === 1 ? "is" : "are"} ${effectiveCount} ${noun} in total`
  })()

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ui-border-subtle pb-4">
      <div className="flex flex-wrap items-center gap-3">
        {filterDrawer ? (
          <button
            type="button"
            onClick={filterDrawer.open}
            className="inline-flex items-center gap-2 rounded-2xl border border-ui-border-base bg-ui-bg-field px-3 py-2 text-xs font-semibold text-ui-fg-base transition hover:border-ui-border-strong"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            <span>Filters</span>
            {filterDrawer.activeCount > 0 && (
              <span className="rounded-full bg-ui-bg-base px-2 py-0.5 text-[11px] font-bold text-ui-fg-muted">
                {filterDrawer.activeCount}
              </span>
            )}
          </button>
        ) : null}
        <p className="text-sm text-ui-fg-base">
          {countText}
        </p>
      </div>

      <div className="flex w-full flex-1 flex-wrap items-center justify-end gap-2 text-sm text-ui-fg-base small:flex-nowrap">
        <div className="flex items-center gap-2" aria-label="Toggle product layout">
          {viewModes.map((mode) => {
            const isActive = effectiveViewMode === mode.value
            const Icon = mode.icon
            return (
              <button
                key={mode.value}
                type="button"
                aria-pressed={isActive}
                onClick={() => handleViewChange(mode.value)}
                className={clx(
                  "inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold transition-all",
                  isActive
                    ? "border-transparent bg-ui-fg-base text-ui-fg-on-inverted shadow-sm"
                    : "border-ui-border-base bg-ui-bg-field text-ui-fg-muted hover:border-ui-border-strong hover:text-ui-fg-base"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                <span>{mode.label}</span>
              </button>
            )
          })}
        </div>

        <SortDropdown value={effectiveSortBy} onChange={handleSortChange} />
      </div>
    </div>
  )
}

export default ResultsToolbar

const SortDropdown = ({
  value,
  onChange,
}: {
  value: SortOptions
  onChange: (value: SortOptions) => void
}) => {
  const listboxId = useId()
  const buttonId = `${listboxId}-button`
  const optionsId = `${listboxId}-options`

  return (
    <Listbox value={value} onChange={onChange}>
      {({ open }) => (
        <div className="relative">
          <ListboxButton
            id={buttonId}
            aria-controls={optionsId}
            className={clx(
              "inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold transition-all",
              "border-ui-border-base bg-ui-bg-field text-ui-fg-base hover:border-ui-border-strong"
            )}
          >
            <span className="text-ui-fg-muted">Sort by:</span>
            <span className="text-ui-fg-base">{SORT_OPTIONS.find((opt) => opt.value === value)?.label ?? "Featured"}</span>
            <ChevronDown
              className={clx("h-4 w-4 text-ui-fg-muted transition-transform", {
                "-scale-y-100": open,
              })}
              aria-hidden
            />
          </ListboxButton>
          <Transition
            show={open}
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 -translate-y-1"
          >
            <ListboxOptions
              id={optionsId}
              aria-labelledby={buttonId}
              className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-ui-border-base bg-white p-1 shadow-lg focus:outline-none"
            >
              {SORT_OPTIONS.map((option) => (
                <ListboxOption
                  key={option.value}
                  value={option.value}
                  className={({ selected, active }) =>
                    clx(
                      "flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm font-medium",
                      active && "bg-ui-bg-field text-ui-fg-base",
                      selected && "text-ui-fg-base",
                      !active && !selected && "text-ui-fg-muted"
                    )
                  }
                >
                  {({ selected }) => (
                    <>
                      <span>{option.label}</span>
                      {selected ? <Check className="h-4 w-4 text-ui-fg-base" aria-hidden /> : null}
                    </>
                  )}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Transition>
        </div>
      )}
    </Listbox>
  )
}
