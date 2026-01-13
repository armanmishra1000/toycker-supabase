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
import type { SearchResultsPayload, SearchProductSummary, SearchCategorySummary, SearchCollectionSummary } from "@lib/data/search"

type SearchDrawerProps = {
  isOpen: boolean
  onClose: () => void
}

const fallbackSuggestions = [
  "LEGO",
  "STEM kits",
  "Remote cars",
  "Outdoor games",
  "Puzzle sets",
  "Action figures",
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
      <Dialog as="div" className="relative z-[70]" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
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
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-primary flex items-center gap-1">
                      <SparklesIcon className="h-4 w-4" /> Curated by Toycker AI
                    </p>
                    <Dialog.Title className="mt-1 text-2xl font-semibold text-slate-900">
                      Search the catalog
                    </Dialog.Title>
                    <p className="text-sm text-slate-500">
                      Find products, categories, and curated collections instantly.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-900/20 hover:text-slate-900"
                    aria-label="Close search"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="border-b border-slate-100 px-6 pb-2 pt-3 space-y-3">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className={`flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 shadow-sm ring-offset-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all ${isListening ? 'ring-2 ring-red-500/20 border-red-500' : ''}`}>
                    {imagePreview ? (
                      <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-slate-100 border border-slate-200 shrink-0">
                        <Image
                          src={imagePreview}
                          alt="Search preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <MagnifyingGlassIcon className={`h-5 w-5 ${isListening ? 'text-red-500' : 'text-slate-400'}`} />
                    )}

                    <input
                      ref={inputRef}
                      type="text"
                      value={isListening ? "Listening..." : query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder={imagePreview ? "Searching with image..." : "Search for toys, brands, themes..."}
                      readOnly={isListening || !!imagePreview}
                      className={`flex-1 border-0 bg-transparent text-base text-slate-900 placeholder-slate-400 focus:outline-none ${isListening ? 'text-red-500 font-medium' : ''}`}
                      aria-label="Search catalog"
                    />

                    <div className="flex items-center gap-2">
                      {(query || imagePreview) && (
                        <button
                          type="button"
                          onClick={handleClear}
                          className="text-sm font-medium text-slate-500 hover:text-slate-900 px-2"
                        >
                          Clear
                        </button>
                      )}

                      {voiceSupported && (
                        <button
                          type="button"
                          onClick={startListening}
                          className={`p-1.5 rounded-full transition-all duration-300 ${isListening ? 'bg-red-500 text-white shadow-lg scale-110' : 'text-slate-400 hover:text-primary hover:bg-primary/5'}`}
                          title="Search by voice"
                        >
                          <MicrophoneIcon className="h-5 w-5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-1.5 rounded-full transition-all duration-300 ${imagePreview ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-primary hover:bg-primary/5'}`}
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
                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                      Smart suggestions
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(suggestions.length ? suggestions : fallbackSuggestions).map((suggestion: string) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => setQuery(suggestion)}
                          className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 hover:border-primary hover:bg-primary/5 hover:text-primary transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 bg-slate-50/60 transition-all duration-500">
                {status === "idle" && !query && !imagePreview && (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-8 text-center animate-in fade-in zoom-in duration-300">
                    <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                      <SparklesIcon className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-base font-medium text-slate-900">
                      Start typing or use AI search
                    </p>
                    <p className="mt-2 text-sm text-slate-500 max-w-xs mx-auto">
                      Search by typing keywords, speaking, or uploading an image of any toy.
                    </p>
                  </div>
                )}

                {status === "loading" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center py-4">
                      <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                        <span className="text-sm font-medium text-slate-600 ml-2">
                          {imagePreview ? "AI is analyzing image..." : "Searching catalog..."}
                        </span>
                      </div>
                    </div>
                    {[...Array(3)].map((_, index) => (
                      <div
                        key={`skeleton-${index}`}
                        className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 animate-pulse"
                      >
                        <div className="h-16 w-16 rounded-xl bg-slate-100" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-3/4 rounded-full bg-slate-100" />
                          <div className="h-3 w-1/2 rounded-full bg-slate-100" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {status === "error" && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                    <span className="flex-1 font-medium">{error}</span>
                    <button onClick={handleClear} className="underline font-bold">Try again</button>
                  </div>
                )}

                {status === "success" && results && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    {results.products.length > 0 && (
                      <ResultSection
                        title={imagePreview ? "Visual Matches" : "Products"}
                        count={results.products.length}
                      >
                        <div className="space-y-3">
                          {results.products.map((product: SearchProductSummary) => (
                            <LocalizedClientLink
                              key={product.id}
                              href={`/products/${product.handle}`}
                              className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 transition-all hover:border-primary/40 hover:shadow-md group active:scale-[0.98]"
                              onClick={handleClose}
                            >
                              {product.thumbnail ? (
                                <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-slate-100">
                                  <Image
                                    src={product.thumbnail}
                                    alt={product.title}
                                    fill
                                    sizes="64px"
                                    className="object-cover transition-transform group-hover:scale-110 duration-300"
                                  />
                                </div>
                              ) : (
                                <div className="h-16 w-16 rounded-2xl bg-slate-100" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="truncate text-base font-medium text-slate-900 group-hover:text-primary transition-colors">
                                  {product.title}
                                </p>
                                {product.price && (
                                  <p className="text-sm text-primary font-semibold">{product.price.formatted}</p>
                                )}
                              </div>
                              <ArrowUpRightIcon className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 mt-2 ml-2" />
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

