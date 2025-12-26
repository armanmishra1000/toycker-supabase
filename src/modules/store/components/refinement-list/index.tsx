"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ChangeEvent, ReactNode, useEffect, useMemo, useState } from "react"
import { useOptionalStorefrontFilters } from "@modules/store/context/storefront-filters"

import { AvailabilityFilter, PRICE_SLIDER_LIMITS } from "./types"

export type ActiveFilter = {
  label: string
  value: string
  paramKey: string | string[]
}

export type FilterOption = {
  label: string
  value: string
  count?: number
  collectionId?: string
}

export type FilterConfig = {
  availability?: FilterOption[]
  ages?: FilterOption[]
  categories?: FilterOption[]
}

export type SelectedFilters = {
  availability?: AvailabilityFilter
  age?: string
  category?: string
  collection?: string
  priceMin?: number
  priceMax?: number
}

export type RefinementListProps = {
  searchQuery?: string | null
  activeFilters?: ActiveFilter[]
  filterOptions?: FilterConfig
  selectedFilters?: SelectedFilters
  onFiltersChange?: (next: SelectedFilters) => void
}

type PriceRangeState = {
  min?: number
  max?: number
}

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
})

const formatCurrency = (value: number) => currencyFormatter.format(value)

const clampToBounds = (value: number | undefined, bounds: typeof PRICE_SLIDER_LIMITS) => {
  if (value === undefined || Number.isNaN(value)) {
    return undefined
  }

  return Math.min(Math.max(value, bounds.min), bounds.max)
}

const normalizePriceRange = (
  range: PriceRangeState,
  bounds: typeof PRICE_SLIDER_LIMITS = PRICE_SLIDER_LIMITS,
  activeField?: "min" | "max"
): PriceRangeState => {
  let min = clampToBounds(range.min, bounds)
  let max = clampToBounds(range.max, bounds)

  if (min !== undefined && max !== undefined) {
    if (activeField === "min" && min > max) {
      max = min
    } else if (activeField === "max" && max < min) {
      min = max
    }
  }

  return {
    min,
    max,
  }
}

const RefinementList = ({
  searchQuery,
  activeFilters,
  filterOptions,
  selectedFilters,
  onFiltersChange,
}: RefinementListProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const storefrontFilters = useOptionalStorefrontFilters()

  const sliderBounds = PRICE_SLIDER_LIMITS
  const fallbackFilters = selectedFilters ?? {}
  const shouldUseCustomState = Boolean(onFiltersChange)
  const effectiveFilters = shouldUseCustomState
    ? fallbackFilters
    : storefrontFilters
    ? {
        availability: storefrontFilters.filters.availability,
        age: storefrontFilters.filters.age,
        category: storefrontFilters.filters.categoryId,
        collection: storefrontFilters.filters.collectionId,
        priceMin: storefrontFilters.filters.priceRange?.min,
        priceMax: storefrontFilters.filters.priceRange?.max,
      }
    : fallbackFilters
  const resolvedSearchQuery = shouldUseCustomState
    ? searchQuery ?? undefined
    : storefrontFilters?.filters.searchQuery ?? searchQuery ?? undefined
  const selectedAvailability = effectiveFilters.availability
  const selectedAge = effectiveFilters.age
  const selectedCategory = effectiveFilters.category
  const selectedPriceMin = effectiveFilters.priceMin
  const selectedPriceMax = effectiveFilters.priceMax

  const [priceRange, setPriceRange] = useState<PriceRangeState>(() =>
    normalizePriceRange(
      {
        min: selectedPriceMin ?? sliderBounds.min,
        max: selectedPriceMax ?? sliderBounds.max,
      },
      sliderBounds
    )
  )

  useEffect(() => {
    setPriceRange(
      normalizePriceRange(
        {
          min: selectedPriceMin ?? sliderBounds.min,
          max: selectedPriceMax ?? sliderBounds.max,
        },
        sliderBounds
      )
    )
  }, [selectedPriceMin, selectedPriceMax, sliderBounds])

  const pushWithParams = (params: URLSearchParams) => {
    const queryString = params.toString()
    router.push(queryString ? `${pathname}?${queryString}` : pathname)
  }

  const updateSearchParams = (updater: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams)
    updater(params)
    params.delete("page")
    pushWithParams(params)
  }

  const toggleCheckboxParam = (name: string, value: string) => {
    const ageOption = name === "age" ? filterOptions?.ages?.find((option) => option.value === value) : undefined

    if (!shouldUseCustomState && storefrontFilters) {
      if (name === "availability") {
        const typedValue = value as AvailabilityFilter
        const nextValue = storefrontFilters.filters.availability === typedValue ? undefined : typedValue
        storefrontFilters.setAvailability(nextValue)
        updateSearchParams((params) => {
          if (nextValue) {
            params.set("availability", nextValue)
          } else {
            params.delete("availability")
          }
        })
      } else if (name === "age") {
        const isActive = storefrontFilters.filters.age === value
        const nextValue = isActive ? undefined : value
        const nextCollection = isActive ? undefined : ageOption?.collectionId
        storefrontFilters.updateFilters({ age: nextValue, collectionId: nextCollection })
        updateSearchParams((params) => {
          if (nextValue) {
            params.set("age", nextValue)
          } else {
            params.delete("age")
          }

          if (nextCollection) {
            params.set("collection", nextCollection)
          } else {
            params.delete("collection")
          }
        })
      } else if (name === "category") {
        const isActive = storefrontFilters.filters.categoryId === value
        const nextValue = isActive ? undefined : value
        storefrontFilters.setCategory(nextValue)
        updateSearchParams((params) => {
          if (nextValue) {
            params.set("category", nextValue)
          } else {
            params.delete("category")
          }
        })
      }
      return
    }

    if (onFiltersChange) {
      if (name === "availability") {
        const typedValue = value as AvailabilityFilter
        const nextValue = effectiveFilters.availability === typedValue ? undefined : typedValue
        onFiltersChange({
          ...effectiveFilters,
          availability: nextValue,
        })
      } else if (name === "age") {
        const nextValue = effectiveFilters.age === value ? undefined : value
        const nextCollection = nextValue ? ageOption?.collectionId : undefined
        onFiltersChange({
          ...effectiveFilters,
          age: nextValue,
          collection: nextCollection,
        })
      } else if (name === "category") {
        const nextValue = effectiveFilters.category === value ? undefined : value
        onFiltersChange({
          ...effectiveFilters,
          category: nextValue,
        })
      }
      return
    }

    updateSearchParams((params) => {
      const currentValue = params.get(name)
      const isActive = currentValue === value

      if (isActive) {
        params.delete(name)
      } else {
        params.set(name, value)
      }

      if (name === "age") {
        if (isActive) {
          params.delete("collection")
        } else if (ageOption?.collectionId) {
          params.set("collection", ageOption.collectionId)
        } else {
          params.delete("collection")
        }
      }
    })
  }

  const commitPriceRange = (range: PriceRangeState) => {
    if (!shouldUseCustomState && storefrontFilters) {
      const min = range.min !== undefined && range.min > sliderBounds.min ? Math.round(range.min) : undefined
      const max = range.max !== undefined && range.max < sliderBounds.max ? Math.round(range.max) : undefined
      storefrontFilters.setPriceRange(
        min === undefined && max === undefined
          ? undefined
          : {
              min,
              max,
            }
      )
      updateSearchParams((params) => {
        if (min !== undefined) {
          params.set("price_min", min.toString())
        } else {
          params.delete("price_min")
        }

        if (max !== undefined) {
          params.set("price_max", max.toString())
        } else {
          params.delete("price_max")
        }
      })
      return
    }

    if (onFiltersChange) {
      const min = range.min !== undefined && range.min > sliderBounds.min ? Math.round(range.min) : undefined
      const max = range.max !== undefined && range.max < sliderBounds.max ? Math.round(range.max) : undefined
      onFiltersChange({
        ...effectiveFilters,
        priceMin: min,
        priceMax: max,
      })
      return
    }

    const params = new URLSearchParams(searchParams)

    if (range.min !== undefined && range.min > sliderBounds.min) {
      params.set("price_min", Math.round(range.min).toString())
    } else {
      params.delete("price_min")
    }

    if (range.max !== undefined && range.max < sliderBounds.max) {
      params.set("price_max", Math.round(range.max).toString())
    } else {
      params.delete("price_max")
    }

    params.delete("page")
    pushWithParams(params)
  }

  const updatePriceRange = (field: "min" | "max", value: number | undefined, commit?: boolean) => {
    const next = normalizePriceRange(
      {
        ...priceRange,
        [field]: clampToBounds(value, sliderBounds),
      },
      sliderBounds,
      field
    )
    setPriceRange(next)

    if (commit) {
      commitPriceRange(next)
    }
  }

  const resolvedFilters = useMemo(() => {
    const chips = [...(activeFilters ?? [])]

    const appendChip = (
      paramKey: string,
      value?: string,
      options?: FilterOption[]
    ) => {
      if (!value) {
        return
      }

      const matchedLabel = options?.find((option) => option.value === value)?.label
      chips.push({
        label: matchedLabel || value,
        value,
        paramKey,
      })
    }

    appendChip("availability", selectedAvailability, filterOptions?.availability)
    appendChip("age", selectedAge, filterOptions?.ages)
    appendChip("category", selectedCategory, filterOptions?.categories)

    if (selectedPriceMin !== undefined || selectedPriceMax !== undefined) {
      const formattedMin = formatCurrency(selectedPriceMin ?? sliderBounds.min)
      const formattedMax = formatCurrency(selectedPriceMax ?? sliderBounds.max)
      chips.push({
        label: `Price: ${formattedMin} – ${formattedMax}`,
        value: `${selectedPriceMin ?? sliderBounds.min}-${selectedPriceMax ?? sliderBounds.max}`,
        paramKey: ["price_min", "price_max"],
      })
    }

    if (resolvedSearchQuery) {
      chips.push({
        label: `Search: "${resolvedSearchQuery}"`,
        value: resolvedSearchQuery,
        paramKey: "q",
      })
    }

    return chips
  }, [
    activeFilters,
    filterOptions,
    resolvedSearchQuery,
    selectedAvailability,
    selectedAge,
    selectedCategory,
    selectedPriceMin,
    selectedPriceMax,
    sliderBounds,
  ])

  const clearFilter = (paramKey: string | string[]) => {
    if (!shouldUseCustomState && storefrontFilters) {
      const keys = Array.isArray(paramKey) ? paramKey : [paramKey]
      keys.forEach((key) => {
        switch (key) {
          case "availability":
            storefrontFilters.setAvailability(undefined)
            break
          case "age":
            storefrontFilters.updateFilters({ age: undefined, collectionId: undefined }, { resetPage: true })
            break
          case "category":
            storefrontFilters.setCategory(undefined)
            break
          case "collection":
            storefrontFilters.setCollection(undefined)
            break
          case "price_min":
          case "price_max":
            storefrontFilters.setPriceRange(undefined)
            break
          case "q":
            storefrontFilters.setSearchQuery(undefined)
            break
          default:
            break
        }
      })
      return
    }

    if (onFiltersChange) {
      const keys = Array.isArray(paramKey) ? paramKey : [paramKey]
      const next: SelectedFilters = { ...effectiveFilters }
      keys.forEach((key) => {
        switch (key) {
          case "availability":
            next.availability = undefined
            break
          case "age":
            next.age = undefined
            next.collection = undefined
            break
          case "category":
            next.category = undefined
            break
          case "collection":
            next.collection = undefined
            break
          case "price_min":
          case "price_max":
            next.priceMin = undefined
            next.priceMax = undefined
            break
          default:
            break
        }
      })
      onFiltersChange(next)
      return
    }

    const params = new URLSearchParams(searchParams)
    const keys = Array.isArray(paramKey) ? paramKey : [paramKey]
    keys.forEach((key) => params.delete(key))
    if (keys.includes("age")) {
      params.delete("collection")
    }
    params.delete("page")
    pushWithParams(params)
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      <section className="space-y-8">
        {resolvedFilters.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-2" data-testid="active-filters">
            {resolvedFilters.map((filter) => (
              <button
                key={`${Array.isArray(filter.paramKey) ? filter.paramKey.join("-") : filter.paramKey}-${filter.value}`}
                type="button"
                onClick={() => clearFilter(filter.paramKey)}
                className="group/filter inline-flex items-center gap-2 rounded-full border border-ui-border-strong/70 bg-ui-bg-base px-3 py-1 text-xs font-medium text-ui-fg-base shadow-sm transition-colors hover:bg-ui-bg-subtle"
                aria-label={`Remove ${filter.label}`}
              >
                <span>{filter.label}</span>
                <span className="text-ui-fg-muted">✕</span>
              </button>
            ))}
          </div>
        )}

        <div className="space-y-8">
          {filterOptions?.availability?.length ? (
            <FilterSection title="Availability">
              <CheckboxGroup
                options={filterOptions.availability}
                  selectedValue={selectedAvailability}
                onChange={(value) => toggleCheckboxParam("availability", value)}
              />
            </FilterSection>
          ) : null}

          <FilterSection title="Price">
            <PriceRangeControls
              sliderBounds={sliderBounds}
              priceRange={priceRange}
              onRangeChange={updatePriceRange}
            />
          </FilterSection>

          {filterOptions?.ages?.length ? (
            <FilterSection title="Shop by age">
              <CheckboxGroup
                options={filterOptions.ages}
                selectedValue={selectedAge}
                onChange={(value) => toggleCheckboxParam("age", value)}
              />
            </FilterSection>
          ) : null}

          {filterOptions?.categories?.length ? (
            <FilterSection title="Category">
              <CheckboxGroup
                options={filterOptions.categories}
                selectedValue={selectedCategory}
                onChange={(value) => toggleCheckboxParam("category", value)}
              />
            </FilterSection>
          ) : null}
        </div>
      </section>
    </div>
  )
}

const FilterSection = ({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) => (
  <div className="space-y-3">
    <p className="text-base font-semibold text-ui-fg-base">{title}</p>
    <div className="space-y-3">{children}</div>
  </div>
)

const CheckboxGroup = ({
  options,
  selectedValue,
  onChange,
}: {
  options: FilterOption[]
  selectedValue?: string
  onChange: (value: string) => void
}) => (
  <div className="space-y-2">
    {options.map((option) => {
      const isChecked = selectedValue === option.value

      return (
        <label key={option.value} className="flex items-center gap-3 text-sm font-medium text-ui-fg-base">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={() => onChange(option.value)}
            className="h-4 w-4 rounded border border-ui-border-base text-ui-fg-base focus:ring-0"
          />
          <span className="flex-1 text-ui-fg-base">
            {option.label}
            {typeof option.count === "number" && (
              <span className="text-ui-fg-muted"> ({option.count})</span>
            )}
          </span>
        </label>
      )
    })}
  </div>
)

const PriceRangeControls = ({
  sliderBounds,
  priceRange,
  onRangeChange,
}: {
  sliderBounds: typeof PRICE_SLIDER_LIMITS
  priceRange: PriceRangeState
  onRangeChange: (field: "min" | "max", value: number | undefined, commit?: boolean) => void
}) => {
  const handleInputChange = (field: "min" | "max", event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value === "" ? undefined : Number(event.target.value)
    onRangeChange(field, Number.isNaN(value as number) ? undefined : value)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <InputField
          value={priceRange.min ?? sliderBounds.min}
          onChange={(event) => handleInputChange("min", event)}
          onBlur={() => onRangeChange("min", priceRange.min, true)}
        />
        <span className="text-sm text-ui-fg-muted">—</span>
        <InputField
          value={priceRange.max ?? sliderBounds.max}
          onChange={(event) => handleInputChange("max", event)}
          onBlur={() => onRangeChange("max", priceRange.max, true)}
        />
      </div>

      <div className="space-y-3">
        <div className="relative h-6">
          <input
            type="range"
            min={sliderBounds.min}
            max={sliderBounds.max}
            step={sliderBounds.step}
            value={priceRange.min ?? sliderBounds.min}
            onChange={(event) => onRangeChange("min", Number(event.target.value))}
            onMouseUp={(event) => onRangeChange("min", Number((event.target as HTMLInputElement).value), true)}
            onTouchEnd={(event) => onRangeChange("min", Number((event.target as HTMLInputElement).value), true)}
            className="absolute inset-0 h-6 w-full appearance-none bg-transparent"
            style={{ accentColor: "#0f172a" }}
          />
          <input
            type="range"
            min={sliderBounds.min}
            max={sliderBounds.max}
            step={sliderBounds.step}
            value={priceRange.max ?? sliderBounds.max}
            onChange={(event) => onRangeChange("max", Number(event.target.value))}
            onMouseUp={(event) => onRangeChange("max", Number((event.target as HTMLInputElement).value), true)}
            onTouchEnd={(event) => onRangeChange("max", Number((event.target as HTMLInputElement).value), true)}
            className="absolute inset-0 h-6 w-full appearance-none bg-transparent"
            style={{ accentColor: "#0f172a" }}
          />
          <div className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 rounded-full border border-ui-fg-base" />
        </div>
        <p className="text-sm font-medium text-ui-fg-base">
          Price: {formatCurrency(priceRange.min ?? sliderBounds.min)} – {formatCurrency(priceRange.max ?? sliderBounds.max)}
        </p>
      </div>
    </div>
  )
}

const InputField = ({
  value,
  onChange,
  onBlur,
}: {
  value: number
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  onBlur: () => void
}) => (
  <div className="flex flex-1 items-center gap-2 rounded-lg border border-ui-border-base px-3 py-2 text-sm font-semibold text-ui-fg-base shadow-sm">
    <span className="text-xs font-semibold text-ui-fg-muted">₹</span>
    <input
      type="number"
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      className="w-full border-none bg-transparent p-0 text-sm font-semibold text-ui-fg-base outline-none"
    />
  </div>
)

export default RefinementList
