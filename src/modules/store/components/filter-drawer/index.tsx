"use client"

import { Dialog, DialogPanel, DialogTitle, Transition } from "@headlessui/react"
import { X } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  Fragment,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import RefinementList, {
  RefinementListProps,
  SelectedFilters,
} from "@modules/store/components/refinement-list"
import { useOptionalStorefrontFilters } from "@modules/store/context/storefront-filters"

type FilterDrawerProps = RefinementListProps & {
  children: ReactNode
  title?: string
}

type FilterDrawerContextValue = {
  open: () => void
  close: () => void
  isOpen: boolean
  activeCount: number
}

const FilterDrawerContext = createContext<FilterDrawerContextValue | null>(null)

export const useFilterDrawer = () => {
  const context = useContext(FilterDrawerContext)

  if (!context) {
    throw new Error("useFilterDrawer must be used within FilterDrawer")
  }

  return context
}

export const useOptionalFilterDrawer = () => useContext(FilterDrawerContext)

const FilterDrawer = ({
  children,
  title = "Filters",
  ...refinementListProps
}: FilterDrawerProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)
  const storefrontFilters = useOptionalStorefrontFilters()
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const fallbackActiveCount = useActiveFilterCount(
    refinementListProps.selectedFilters,
    refinementListProps.searchQuery ?? undefined
  )
  const activeCount = storefrontFilters?.activeFilterCount ?? fallbackActiveCount
  const filterSignature = useFilterSignature(
    refinementListProps.selectedFilters,
    refinementListProps.searchQuery ?? undefined
  )
  const lastSignatureRef = useRef(filterSignature)
  const snapshot = useFilterSnapshot(refinementListProps.selectedFilters, refinementListProps.searchQuery ?? undefined)
  const [pendingFilters, setPendingFilters] = useState<SelectedFilters>(() => snapshotToSelected(snapshot))

  const syncRouterParams = useCallback(
    (mutator: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams)
      mutator(params)
      params.delete("page")
      const queryString = params.toString()
      router.push(queryString ? `${pathname}?${queryString}` : pathname)
    },
    [pathname, router, searchParams]
  )

  useEffect(() => {
    if (isOpen) {
      setPendingFilters(snapshotToSelected(snapshot))
    }
  }, [isOpen, snapshot])

  useEffect(() => {
    if (!isOpen) {
      lastSignatureRef.current = filterSignature
      return
    }

    if (lastSignatureRef.current !== filterSignature) {
      lastSignatureRef.current = filterSignature
      close()
    }
  }, [filterSignature, isOpen, close])

  const value = useMemo(
    () => ({
      open,
      close,
      isOpen,
      activeCount,
    }),
    [open, close, isOpen, activeCount]
  )

  const hasChanges = useMemo(() => !areFiltersEqual(pendingFilters, snapshotToSelected(snapshot)), [pendingFilters, snapshot])

  const applyFilters = () => {
    if (!storefrontFilters) {
      close()
      return
    }

    const nextPrice =
      pendingFilters.priceMin === undefined && pendingFilters.priceMax === undefined
        ? undefined
        : {
            min: pendingFilters.priceMin,
            max: pendingFilters.priceMax,
          }

    storefrontFilters.updateFilters({
      availability: pendingFilters.availability,
      age: pendingFilters.age,
      categoryId: pendingFilters.category,
      collectionId: pendingFilters.collection,
      priceRange: nextPrice,
    })

    syncRouterParams((params) => {
      const assignParam = (key: string, nextValue?: string | number) => {
        if (nextValue !== undefined && nextValue !== "") {
          params.set(key, String(nextValue))
        } else {
          params.delete(key)
        }
      }

      assignParam("availability", pendingFilters.availability)
      assignParam("age", pendingFilters.age)
      assignParam("collection", pendingFilters.collection)
      assignParam("category", pendingFilters.category)
      assignParam(
        "price_min",
        pendingFilters.priceMin !== undefined ? Math.round(pendingFilters.priceMin) : undefined
      )
      assignParam(
        "price_max",
        pendingFilters.priceMax !== undefined ? Math.round(pendingFilters.priceMax) : undefined
      )
    })
    close()
  }

  return (
    <FilterDrawerContext.Provider value={value}>
      {children}
      <Transition show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={close}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-out duration-300"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in duration-200"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <DialogPanel className="flex h-full w-full max-w-md flex-col bg-ui-bg-base shadow-elevation-card-rest">
                <div className="flex items-center justify-between border-b border-ui-border-subtle px-5 py-4">
                  <DialogTitle className="text-base font-semibold text-ui-fg-base">
                    {title}
                  </DialogTitle>
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-full border border-ui-border-base p-1 text-ui-fg-muted transition hover:border-ui-border-strong hover:text-ui-fg-base"
                    aria-label="Close filters"
                  >
                    <X className="h-5 w-5" aria-hidden />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-6">
                  <RefinementList
                    {...refinementListProps}
                    selectedFilters={pendingFilters}
                    onFiltersChange={setPendingFilters}
                  />
                </div>
                <div className="border-t border-ui-border-subtle px-5 py-4">
                  <button
                    type="button"
                    onClick={applyFilters}
                    disabled={!hasChanges}
                    className="w-full rounded-2xl bg-ui-fg-base px-4 py-3 text-sm font-semibold text-ui-fg-on-inverted transition disabled:cursor-not-allowed disabled:bg-ui-fg-disabled"
                  >
                    Apply filters
                  </button>
                </div>
              </DialogPanel>
            </Transition.Child>
            <div className="w-full" onClick={close} aria-hidden />
          </div>
        </Dialog>
      </Transition>
    </FilterDrawerContext.Provider>
  )
}

type FilterSnapshot = {
  availability?: string
  age?: string
  category?: string
  price?: { min?: number; max?: number }
  search?: string
  collection?: string
}

const useFilterSnapshot = (selectedFilters?: SelectedFilters, searchQuery?: string) => {
  const storefrontFilters = useOptionalStorefrontFilters()

  return useMemo<FilterSnapshot>(() => {
    const availability = storefrontFilters?.filters.availability ?? selectedFilters?.availability
    const age = storefrontFilters?.filters.age ?? selectedFilters?.age
    const category = storefrontFilters?.filters.categoryId ?? selectedFilters?.category
    const collection = storefrontFilters?.filters.collectionId ?? selectedFilters?.collection
    const price = storefrontFilters?.filters.priceRange ??
      (selectedFilters?.priceMin !== undefined || selectedFilters?.priceMax !== undefined
        ? { min: selectedFilters?.priceMin, max: selectedFilters?.priceMax }
        : undefined)
    const search = storefrontFilters?.filters.searchQuery ?? searchQuery

    return {
      availability,
      age,
      category,
      price,
      search,
      collection,
    }
  }, [storefrontFilters, selectedFilters, searchQuery])
}

const useActiveFilterCount = (selectedFilters?: SelectedFilters, searchQuery?: string) => {
  const snapshot = useFilterSnapshot(selectedFilters, searchQuery)

  return useMemo(() => {
    let count = 0
    if (snapshot.availability) count += 1
    if (snapshot.age) count += 1
    if (snapshot.category) count += 1
    if (snapshot.price && (snapshot.price.min !== undefined || snapshot.price.max !== undefined)) {
      count += 1
    }
    if (snapshot.search) count += 1
    if (snapshot.collection && !snapshot.age) count += 1

    return count
  }, [snapshot])
}

const useFilterSignature = (selectedFilters?: SelectedFilters, searchQuery?: string) => {
  const snapshot = useFilterSnapshot(selectedFilters, searchQuery)

  return useMemo(() => JSON.stringify(snapshot), [snapshot])
}

const snapshotToSelected = (snapshot: FilterSnapshot): SelectedFilters => ({
  availability: snapshot.availability as SelectedFilters["availability"],
  age: snapshot.age,
  category: snapshot.category,
  priceMin: snapshot.price?.min,
  priceMax: snapshot.price?.max,
  collection: snapshot.collection,
})

const areFiltersEqual = (a: SelectedFilters, b: SelectedFilters) =>
  a.availability === b.availability &&
  a.age === b.age &&
  a.category === b.category &&
  a.collection === b.collection &&
  (a.priceMin ?? undefined) === (b.priceMin ?? undefined) &&
  (a.priceMax ?? undefined) === (b.priceMax ?? undefined)

export default FilterDrawer
