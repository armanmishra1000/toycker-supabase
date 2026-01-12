"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Fragment, useId } from "react"

import { cn } from "@lib/util/cn"
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
    <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 md:gap-4">
      {/* Primary Toolbar Actions */}
      <div className="flex items-center justify-between w-full gap-4">
        <div className="flex items-center gap-3">
          {filterDrawer ? (
            <button
              type="button"
              onClick={filterDrawer.open}
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm md:px-3 md:py-2 md:text-xs font-semibold text-gray-900 transition hover:border-gray-300 shadow-sm md:shadow-none"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden />
              <span>Filters</span>
              {filterDrawer.activeCount > 0 && (
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-gray-500">
                  {filterDrawer.activeCount}
                </span>
              )}
            </button>
          ) : null}

          {/* Desktop Count Display */}
          <div className="hidden md:block">
            <p className="text-sm text-gray-900 font-medium">
              {countText}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle (Desktop only) */}
          {/* View Mode Toggle */}
          <div className="hidden md:flex items-center gap-2" aria-label="Toggle product layout">
            {/* 4 Column (Medium/1280px+) */}
            <button
              type="button"
              onClick={() => handleViewChange("grid-4")}
              className={cn(
                "hidden medium:inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold transition-all hover:shadow-sm",
                effectiveViewMode === "grid-4"
                  ? "border-transparent bg-gray-900 text-white shadow-sm"
                  : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:text-gray-900"
              )}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden />
              <span>4 column</span>
            </button>

            {/* 5 Column (Medium/1280px+) */}
            <button
              type="button"
              onClick={() => handleViewChange("grid-5")}
              className={cn(
                "hidden medium:inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold transition-all hover:shadow-sm",
                effectiveViewMode === "grid-5"
                  ? "border-transparent bg-gray-900 text-white shadow-sm"
                  : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:text-gray-900"
              )}
            >
              <PanelsTopLeft className="h-4 w-4" aria-hidden />
              <span>5 column</span>
            </button>

            {/* 3 Column (Small/1024px only) */}
            <button
              type="button"
              onClick={() => handleViewChange("grid-4")}
              className={cn(
                "hidden small:inline-flex medium:hidden items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold transition-all hover:shadow-sm",
                effectiveViewMode !== "list"
                  ? "border-transparent bg-gray-900 text-white shadow-sm"
                  : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:text-gray-900"
              )}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden />
              <span>3 column</span>
            </button>

            {/* 2 Column (MD/768px only) */}
            <button
              type="button"
              onClick={() => handleViewChange("grid-4")}
              className={cn(
                "hidden md:inline-flex small:hidden items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold transition-all hover:shadow-sm",
                effectiveViewMode !== "list"
                  ? "border-transparent bg-gray-900 text-white shadow-sm"
                  : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:text-gray-900"
              )}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden />
              <span>2 column</span>
            </button>

            {/* List Toggle (Standard) */}
            <button
              type="button"
              onClick={() => handleViewChange("list")}
              className={cn(
                "inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold transition-all hover:shadow-sm",
                effectiveViewMode === "list"
                  ? "border-transparent bg-gray-900 text-white shadow-sm"
                  : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:text-gray-900"
              )}
            >
              <Rows className="h-4 w-4" aria-hidden />
              <span>List</span>
            </button>
          </div>

          <SortDropdown value={effectiveSortBy} onChange={handleSortChange} />
        </div>
      </div>

      {/* Mobile Count Display (Below filters) */}
      <div className="md:hidden">
        <p className="text-sm text-gray-500 font-medium">
          {countText}
        </p>
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
  onChange: (_value: SortOptions) => void
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
            className={cn(
              "inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm md:px-3 md:py-2 md:text-xs font-semibold transition-all shadow-sm md:shadow-none",
              "border-gray-200 bg-gray-50 text-gray-900 hover:border-gray-300"
            )}
          >
            <span className="text-gray-500">Sort by:</span>
            <span className="text-gray-900">{SORT_OPTIONS.find((opt) => opt.value === value)?.label ?? "Featured"}</span>
            <ChevronDown
              className={cn("h-4 w-4 text-gray-500 transition-transform", {
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
              className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-gray-200 bg-white p-1 shadow-lg focus:outline-none"
            >
              {SORT_OPTIONS.map((option) => (
                <ListboxOption
                  key={option.value}
                  value={option.value}
                  className={({ selected, active }) =>
                    cn(
                      "flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm font-medium",
                      active && "bg-gray-50 text-gray-900",
                      selected && "text-gray-900",
                      !active && !selected && "text-gray-500"
                    )
                  }
                >
                  {({ selected }) => (
                    <>
                      <span>{option.label}</span>
                      {selected ? <Check className="h-4 w-4 text-gray-900" aria-hidden /> : null}
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
