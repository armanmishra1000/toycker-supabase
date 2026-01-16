"use client"

import { Fragment, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowUpRightIcon,
  CameraIcon,
  MagnifyingGlassIcon,
  MicrophoneIcon,
  SparklesIcon,
  XMarkIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline"
import { Dialog, Transition } from "@headlessui/react"
import Image from "next/image"

import { useBodyScrollLock } from "@modules/layout/hooks/useBodyScrollLock"
import { useSearchResults } from "@modules/layout/hooks/useSearchResults"
import { useVoiceSearch } from "@modules/layout/hooks/useVoiceSearch"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { DEFAULT_COUNTRY_CODE } from "@lib/constants/region"
import type { SearchProductSummary, SearchCategorySummary, SearchCollectionSummary } from "@lib/data/search"

type SearchDrawerProps = {
  isOpen: boolean
  onClose: () => void
}

const fallbackSuggestions = [
  "DANCING OCTOPUS TOY",
  "DOUBLE INERITICA INSECT BEETLE",
  "Hand Fan For Kids",
  "Musical Toys",
  "Action Figures",
  "18-36 Months",
]

const SearchDrawer = ({ isOpen, onClose }: SearchDrawerProps) => {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const countryCode = DEFAULT_COUNTRY_CODE
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const buildLocalizedPath = (path: string) => {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`
    return normalizedPath
  }

  const {
    query,
    setQuery,
    clear,
    status,
    error,
    results,
    suggestions,
    isEmpty,
    searchByImage,
  } = useSearchResults({
    countryCode,
    productLimit: 6,
    taxonomyLimit: 5,
  })

  const { isListening, startListening, stopListening, supported: voiceSupported } = useVoiceSearch((text) => {
    setQuery(text)
  })

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      searchByImage(file)
    }
  }

  const handleClear = () => {
    clear()
    setImagePreview(null)
    stopListening()
  }

  const handleClose = () => {
    handleClear()
    onClose()
  }

  const canViewAll = Boolean(query.trim())

  useBodyScrollLock({ isLocked: isOpen })

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const timer = window.setTimeout(() => {
      inputRef.current?.focus()
    }, 120)

    return () => window.clearTimeout(timer)
  }, [isOpen])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    if (!query.trim()) {
      return
    }

    router.push(buildLocalizedPath(`/store?q=${encodeURIComponent(query.trim())}`))
    handleClose()
  }

  const renderEmptyState = () => (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-6 py-12 text-center">
      <p className="text-lg font-semibold text-slate-900">No matches yet</p>
      <p className="mt-2 text-sm text-slate-500">
        {imagePreview
          ? "We couldn't find products visually similar to your photo."
          : "Try refining your keywords or explore the smart suggestions above."}
      </p>
    </div>
  )

  return (
    <Transition show={isOpen} as={Fragment} appear>
      <Dialog as="div" className="relative z-[150]" onClose={handleClose}>
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

        <div className="fixed inset-0 flex justify-start">
          <Transition.Child
            as={Fragment}
            enter="transform transition ease-out duration-200"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transform transition ease-in duration-200"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <Dialog.Panel className="flex h-full w-full max-w-[640px] flex-col bg-white shadow-[0_20px_45px_rgba(15,23,42,0.25)]">
              <div className="border-b border-slate-200 px-6 py-5">
                <div className="flex items-start justify-between">
                  <div className="pr-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-primary flex items-center gap-1">
                      <SparklesIcon className="h-4 w-4" /> Curated by Toycker AI
                    </p>
                    <Dialog.Title className="mt-1 text-2xl font-semibold text-slate-900">
                      Search the catalog
                    </Dialog.Title>
                    <p className="text-sm text-slate-500 mt-1">
                      Find products, categories, and curated collections instantly.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
                    aria-label="Close search"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="border-b border-slate-100 px-6 pb-2 pt-3 space-y-3">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className={`group flex items-center rounded-2xl border-2 transition-all duration-300 ${isListening ? 'border-red-500 bg-red-50/10 shadow-[0_0_20px_rgba(239,68,68,0.15)]' : 'border-gray-200 bg-white focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10'}`}>
                    {imagePreview ? (
                      <div className="relative ml-2 h-10 w-10 overflow-hidden rounded-xl border border-slate-200 shadow-sm shrink-0 group-focus-within:border-primary/30">
                        <Image
                          src={imagePreview}
                          alt="Search preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <MagnifyingGlassIcon className={`ml-3 sm:ml-4 h-6 w-6 shrink-0 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-slate-400 group-focus-within:text-primary'}`} />
                    )}

                    <input
                      ref={inputRef}
                      type="text"
                      value={isListening ? "Listening..." : query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder={imagePreview ? "Refine..." : "Search..."}
                      readOnly={isListening}
                      className={`flex-1 min-w-0 border-0 bg-transparent py-3 sm:py-4 pl-3 text-base sm:text-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0 ${isListening ? 'text-red-500 font-medium' : ''}`}
                      aria-label="Search catalog"
                    />

                    <div className="flex items-center gap-1 pr-2 shrink-0">
                      {(query || imagePreview) && (
                        <button
                          type="button"
                          onClick={handleClear}
                          className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
                          title="Clear search"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      )}

                      {voiceSupported && (
                        <button
                          type="button"
                          onClick={startListening}
                          className={`rounded-full p-2 sm:p-2.5 transition-all duration-300 ${isListening ? 'bg-red-500 text-white shadow-lg scale-110' : 'text-slate-400 hover:bg-slate-50 hover:text-primary'}`}
                          title="Search by voice"
                        >
                          <MicrophoneIcon className="h-5 w-5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`rounded-full p-2 sm:p-2.5 transition-all duration-300 ${imagePreview ? 'bg-primary text-white shadow-lg transform rotate-6' : 'text-slate-400 hover:bg-slate-50 hover:text-primary'}`}
                        title="Search by image"
                      >
                        {imagePreview ? <PhotoIcon className="h-5 w-5" /> : <CameraIcon className="h-5 w-5" />}
                      </button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </div>
                  </div>
                </form>

                {(suggestions.length > 0 || fallbackSuggestions.length > 0) && !imagePreview && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="flex gap-2 pt-2 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6 sm:mx-0 sm:px-0 sm:flex-wrap">
                      {(suggestions.length ? suggestions : fallbackSuggestions).map((suggestion: string) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => setQuery(suggestion)}
                          className="group flex flex-shrink-0 items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50/50 px-3 py-1.5 text-sm font-medium text-slate-600 transition-all hover:border-primary/20 hover:bg-primary/5 hover:text-primary hover:shadow-sm whitespace-nowrap"
                        >
                          <MagnifyingGlassIcon className="h-3.5 w-3.5 text-slate-400 transition-colors group-hover:text-primary/60" />
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-50/30 px-6 py-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200">
                {status === "idle" && !query && !imagePreview && (
                  <div className="flex h-full flex-col items-center justify-center space-y-6 text-center opacity-60">
                    <div className="relative">
                      <div className="absolute -inset-4 rounded-full bg-primary/5 blur-2xl" />
                      <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-sm ring-1 ring-slate-100">
                        <SparklesIcon className="h-10 w-10 text-primary/80" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Discover Something New</h3>
                      <p className="mt-2 text-sm text-slate-500 max-w-[260px] mx-auto leading-relaxed">
                        Try searching for <span className="text-primary font-medium">"Robot"</span> or upload a photo to find similar toys.
                      </p>
                    </div>
                  </div>
                )}

                {status === "loading" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-center">
                      <div className="inline-flex items-center gap-3 rounded-full bg-white px-5 py-2.5 shadow-sm ring-1 ring-slate-100">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                        </span>
                        <span className="text-sm font-medium text-slate-600">
                          {imagePreview ? "Analyzing visual patterns..." : "Searching catalog..."}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      {[...Array(5)].map((_, index) => (
                        <div
                          key={`skeleton-${index}`}
                          className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm animate-pulse"
                        >
                          <div className="h-20 w-20 shrink-0 rounded-xl bg-slate-100" />
                          <div className="flex-1 space-y-3 py-1">
                            <div className="h-4 w-3/4 rounded-full bg-slate-100" />
                            <div className="h-4 w-1/4 rounded-full bg-slate-100" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {status === "error" && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="rounded-full bg-red-50 p-4">
                      <XMarkIcon className="h-8 w-8 text-red-500" />
                    </div>
                    <p className="mt-4 font-medium text-slate-900">{error}</p>
                    <button
                      onClick={handleClear}
                      className="mt-2 text-sm font-semibold text-primary hover:underline"
                    >
                      Try again
                    </button>
                  </div>
                )}

                {status === "success" && results && (
                  <div className="space-y-8 pb-10">
                    {/* Products Grid */}
                    {results.products.length > 0 && (
                      <ResultSection
                        title={imagePreview ? "Visual Matches" : "Products"}
                        count={results.products.length}
                      >
                        <div className="flex flex-col gap-3">
                          {results.products.map((product: SearchProductSummary) => (
                            <LocalizedClientLink
                              key={product.id}
                              href={`/products/${product.handle}`}
                              className="group relative flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-3 transition-all duration-300 hover:border-primary/20 hover:shadow-md hover:bg-slate-50/50"
                              onClick={handleClose}
                            >
                              {/* Image Container */}
                              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-100">
                                {product.thumbnail ? (
                                  <Image
                                    src={product.thumbnail}
                                    alt={product.title}
                                    fill
                                    sizes="80px"
                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-slate-300">
                                    <PhotoIcon className="h-8 w-8" />
                                  </div>
                                )}
                              </div>

                              {/* Content */}
                              <div className="flex flex-1 flex-col justify-center min-w-0 py-1">
                                <h4 className="truncate text-base font-semibold text-slate-900 group-hover:text-primary transition-colors">
                                  {product.title}
                                </h4>
                                <div className="mt-1 flex items-center gap-2">
                                  {product.price && (
                                    <p className="text-sm font-bold text-primary">
                                      {product.price.formatted}
                                    </p>
                                  )}
                                  {imagePreview && (
                                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                      Match
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Action Arrow */}
                              <div className="pr-2 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary">
                                <ArrowUpRightIcon className="h-5 w-5" />
                              </div>
                            </LocalizedClientLink>
                          ))}
                        </div>
                      </ResultSection>
                    )}

                    {!imagePreview && results.categories.length > 0 && (
                      <ResultSection title="Categories" count={results.categories.length}>
                        <div className="flex flex-wrap gap-2">
                          {results.categories.map((category: SearchCategorySummary) => (
                            <LocalizedClientLink
                              key={category.id}
                              href={`/categories/${category.handle}`}
                              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-primary/50 hover:text-primary hover:shadow-sm"
                              onClick={handleClose}
                            >
                              <span>{category.name}</span>
                              <ArrowUpRightIcon className="h-4 w-4" />
                            </LocalizedClientLink>
                          ))}
                        </div>
                      </ResultSection>
                    )}

                    {!imagePreview && results.collections.length > 0 && (
                      <ResultSection title="Collections" count={results.collections.length}>
                        <div className="flex flex-wrap gap-2">
                          {results.collections.map((collection: SearchCollectionSummary) => (
                            <LocalizedClientLink
                              key={collection.id}
                              href={`/collections/${collection.handle}`}
                              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-primary/50 hover:text-primary hover:shadow-sm"
                              onClick={handleClose}
                            >
                              <span>{collection.title}</span>
                              <ArrowUpRightIcon className="h-4 w-4" />
                            </LocalizedClientLink>
                          ))}
                        </div>
                      </ResultSection>
                    )}

                    {isEmpty && renderEmptyState()}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 bg-white px-6 py-4">
                <LocalizedClientLink
                  href={canViewAll ? `/store?q=${encodeURIComponent(query.trim())}` : "#"}
                  className={`flex h-12 items-center justify-center rounded-full text-sm font-semibold transition ${canViewAll
                    ? "bg-primary text-white hover:bg-primary/90 shadow-lg active:scale-95 transition-all"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed pointer-events-none"
                    }`}
                  aria-disabled={!canViewAll}
                  onClick={() => {
                    if (!canViewAll) {
                      return
                    }
                    handleClose()
                  }}
                >
                  View all results
                </LocalizedClientLink>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}

const ResultSection = ({
  title,
  count,
  children,
}: {
  title: string
  count: number
  children: React.ReactNode
}) => (
  <section className="space-y-3 animate-in fade-in slide-in-from-left-2 duration-300">
    <div className="flex items-center justify-between px-1">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
        {count} hit{count === 1 ? "" : "s"}
      </span>
    </div>
    {children}
  </section>
)

export default SearchDrawer

