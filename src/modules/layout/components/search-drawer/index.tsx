"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { Fragment, useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowUpRightIcon,
  MagnifyingGlassIcon,
  MicrophoneIcon,
  SparklesIcon,
  StopIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline"
import { Dialog, Transition } from "@headlessui/react"

import { useBodyScrollLock } from "@modules/layout/hooks/useBodyScrollLock"
import { useSearchResults } from "@modules/layout/hooks/useSearchResults"
import { useVoiceSearch } from "@modules/layout/hooks/useVoiceSearch"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { DEFAULT_COUNTRY_CODE } from "@lib/constants/region"
import type { SearchResultsPayload } from "@lib/data/search"

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

type SearchStatus = "idle" | "loading" | "success" | "error"

const IMAGE_SEARCH_ENABLED = process.env.NEXT_PUBLIC_IMAGE_SEARCH_ENABLED === "true"

const SearchDrawer = ({ isOpen, onClose }: SearchDrawerProps) => {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const countryCode = DEFAULT_COUNTRY_CODE
  const [activeTab, setActiveTab] = useState<"text" | "image">("text")
  const [imageStatus, setImageStatus] = useState<SearchStatus>("idle")
  const [imageResults, setImageResults] = useState<SearchResultsPayload | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const isImageSearchAvailable = IMAGE_SEARCH_ENABLED

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
  } = useSearchResults({ countryCode })

  const {
    isSupported: isVoiceSupported,
    isListening,
    transcript,
    error: voiceError,
    startListening,
    stopListening,
  } = useVoiceSearch({
    onResult: (value) => setQuery(value),
  })

  const statusForDisplay = activeTab === "image" ? imageStatus : status
  const resultsForDisplay = activeTab === "image" ? imageResults : results
  const errorForDisplay = activeTab === "image" ? imageError : error
  const canViewAll = activeTab === "text" && Boolean(query.trim())

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!isImageSearchAvailable) {
      setImagePreview(null)
      setImageResults(null)
      setImageError("Image search is coming soon")
      setImageStatus("idle")
      return
    }

    setImageError(null)
    setImageStatus("loading")
    setImagePreview(URL.createObjectURL(file))

    const params = new URLSearchParams({
      countryCode,
      limit: "6",
    })

    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch(`/api/storefront/search/image?${params.toString()}`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { message?: string }
        throw new Error(payload.message || "Unable to search by image")
      }

      const payload = (await response.json()) as SearchResultsPayload
      setImageResults(payload)
      setImageStatus("success")
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : "Unexpected error"
      setImageError(message)
      setImageStatus(message === "Image search provider not configured" ? "idle" : "error")
    }
  }

  const isActiveEmpty = activeTab === "image"
    ? Boolean(
        resultsForDisplay &&
          resultsForDisplay.products.length === 0 &&
          resultsForDisplay.categories.length === 0 &&
          resultsForDisplay.collections.length === 0
      )
    : isEmpty

  useBodyScrollLock({ isLocked: isOpen })

  useEffect(() => {
    if (!isOpen) {
      stopListening()
      setActiveTab("text")
      setImageStatus("idle")
      setImageError(null)
      setImageResults(null)
      setImagePreview(null)
      return
    }

    const timer = window.setTimeout(() => {
      inputRef.current?.focus()
    }, 120)

    return () => window.clearTimeout(timer)
  }, [isOpen, stopListening])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    if (!query.trim()) {
      return
    }

    router.push(buildLocalizedPath(`/store?q=${encodeURIComponent(query.trim())}`))
    onClose()
  }

  const voiceStatusLabel = useMemo(() => {
    if (!isVoiceSupported) {
      return "Voice search is unavailable in this browser"
    }

    if (isListening) {
      return "Listening... speak naturally"
    }

    if (transcript) {
      return `Heard: “${transcript}”`
    }

    return "Use voice to search for toys hands-free"
  }, [isListening, isVoiceSupported, transcript])

  const renderEmptyState = () => (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-6 py-12 text-center">
      <p className="text-lg font-semibold text-slate-900">No matches yet</p>
      <p className="mt-2 text-sm text-slate-500">
        Try refining your keywords or explore the smart suggestions above.
      </p>
    </div>
  )

  return (
    <Transition show={isOpen} as={Fragment} appear>
      <Dialog as="div" className="relative z-[70]" onClose={onClose}>
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
                    onClick={onClose}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-900/20 hover:text-slate-900"
                    aria-label="Close search"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="border-b border-slate-100 px-6 pb-2 pt-3 space-y-3">
                <div className="inline-flex gap-2 rounded-full bg-slate-100 p-1">
                  {["text", "image"].map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab as typeof activeTab)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                        activeTab === tab
                          ? "bg-white shadow-sm text-slate-900"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      {tab === "text" && "Text + Voice"}
                      {tab === "image" && "Image"}
                    </button>
                  ))}
                </div>

                {activeTab === "text" && (
                  <form onSubmit={handleSubmit} className="space-y-2">
                    <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm ring-offset-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                      <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
                      <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search for toys, brands, themes..."
                        className="flex-1 border-0 bg-transparent text-base text-slate-900 placeholder-slate-400 focus:outline-none"
                        aria-label="Search catalog"
                      />
                      {query && (
                        <button
                          type="button"
                          onClick={clear}
                          className="text-sm font-medium text-slate-500 hover:text-slate-900"
                        >
                          Clear
                        </button>
                      )}
                      {isVoiceSupported && (
                        <button
                          type="button"
                          onClick={isListening ? stopListening : startListening}
                          className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
                            isListening
                              ? "border-red-500 bg-red-50 text-red-600"
                              : "border-slate-200 text-slate-600 hover:border-primary hover:text-primary"
                          }`}
                          aria-label={isListening ? "Stop voice search" : "Start voice search"}
                        >
                          {isListening ? (
                            <StopIcon className="h-5 w-5" />
                          ) : (
                            <MicrophoneIcon className="h-5 w-5" />
                          )}
                        </button>
                      )}
                    </div>
                    {isVoiceSupported && (
                      <p className="text-xs text-slate-500">
                        {voiceStatusLabel}
                        {voiceError && (
                          <span className="ml-1 text-red-500">{voiceError}</span>
                        )}
                      </p>
                    )}
                  </form>
                )}

                {activeTab === "image" && (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4">
                    <label
                      className={`flex flex-col items-center justify-center gap-3 ${
                        isImageSearchAvailable ? "cursor-pointer" : "cursor-not-allowed opacity-70"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-slate-600">
                        <SparklesIcon className="h-5 w-5" />
                        <span className="text-sm font-medium">Upload a product photo</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                        disabled={!isImageSearchAvailable}
                      />
                      {imagePreview && (
                        <div className="relative h-24 w-24 overflow-hidden rounded-xl border border-slate-200">
                          <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                        </div>
                      )}
                      {!isImageSearchAvailable && (
                        <p className="text-xs font-semibold text-primary">Coming Soon</p>
                      )}
                      <p className="text-xs text-slate-500 text-center">
                        We will find visually similar items. Supported: png, jpg, webp.
                      </p>
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-semibold ${
                          isImageSearchAvailable
                            ? "bg-primary text-white"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {isImageSearchAvailable ? "Choose image" : "Coming soon"}
                      </span>
                    </label>
                    {imageError && (
                      <p className="mt-2 text-xs text-red-500">{imageError}</p>
                    )}
                  </div>
                )}

                {activeTab === "text" && (suggestions.length > 0 || fallbackSuggestions.length > 0) && (
                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                      Smart suggestions
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(suggestions.length ? suggestions : fallbackSuggestions).map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => setQuery(suggestion)}
                          className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 hover:border-primary hover:bg-primary/5 hover:text-primary"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-slate-50/60">
                {statusForDisplay === "idle" && activeTab === "text" && !query && (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-8 text-center">
                    <p className="text-base font-medium text-slate-900">
                      Start typing or use your voice to discover toys faster.
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      We’ll surface matching products, categories, and collections instantly.
                    </p>
                  </div>
                )}

                {statusForDisplay === "loading" && (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, index) => (
                      <div
                        key={`skeleton-${index}`}
                        className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4"
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

                {statusForDisplay === "error" && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorForDisplay}
                  </div>
                )}

                {statusForDisplay === "success" && resultsForDisplay && (
                  <div className="space-y-6">
                    {resultsForDisplay.products.length > 0 && (
                      <ResultSection title="Products" count={resultsForDisplay.products.length}>
                        <div className="space-y-3">
                          {resultsForDisplay.products.map((product) => (
                            <LocalizedClientLink
                              key={product.id}
                              href={`/products/${product.handle}`}
                              className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 transition hover:border-primary/40"
                              onClick={onClose}
                            >
                              {product.thumbnail ? (
                                <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-slate-100">
                                  <Image
                                    src={product.thumbnail}
                                    alt={product.title}
                                    fill
                                    sizes="64px"
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="h-16 w-16 rounded-2xl bg-slate-100" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="truncate text-base font-medium text-slate-900">
                                  {product.title}
                                </p>
                                {product.price && (
                                  <p className="text-sm text-primary">{product.price.formatted}</p>
                                )}
                              </div>
                              <ArrowUpRightIcon className="h-5 w-5 text-slate-300" />
                            </LocalizedClientLink>
                          ))}
                        </div>
                      </ResultSection>
                    )}

                    {resultsForDisplay.categories.length > 0 && (
                      <ResultSection title="Categories" count={resultsForDisplay.categories.length}>
                        <div className="flex flex-wrap gap-3">
                          {resultsForDisplay.categories.map((category) => (
                            <LocalizedClientLink
                              key={category.id}
                              href={`/categories/${category.handle}`}
                              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-primary/50 hover:text-primary"
                              onClick={onClose}
                            >
                              <span>{category.name}</span>
                              <ArrowUpRightIcon className="h-4 w-4" />
                            </LocalizedClientLink>
                          ))}
                        </div>
                      </ResultSection>
                    )}

                    {resultsForDisplay.collections.length > 0 && (
                      <ResultSection title="Collections" count={resultsForDisplay.collections.length}>
                        <div className="flex flex-wrap gap-3">
                          {resultsForDisplay.collections.map((collection) => (
                            <LocalizedClientLink
                              key={collection.id}
                              href={`/collections/${collection.handle}`}
                              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-primary/50 hover:text-primary"
                              onClick={onClose}
                            >
                              <span>{collection.title}</span>
                              <ArrowUpRightIcon className="h-4 w-4" />
                            </LocalizedClientLink>
                          ))}
                        </div>
                      </ResultSection>
                    )}

                    {isActiveEmpty && renderEmptyState()}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 bg-white px-6 py-4">
                <LocalizedClientLink
                  href={canViewAll ? `/store?q=${encodeURIComponent(query.trim())}` : "#"}
                  className={`flex h-12 items-center justify-center rounded-full text-sm font-semibold transition ${
                    canViewAll
                      ? "bg-primary text-white hover:bg-primary/90"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed pointer-events-none"
                  }`}
                  aria-disabled={!canViewAll}
                  onClick={() => {
                    if (!canViewAll) {
                      return
                    }
                    onClose()
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
  <section className="space-y-3">
    <div className="flex items-center justify-between">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
        {count} hit{count === 1 ? "" : "s"}
      </span>
    </div>
    {children}
  </section>
)

export default SearchDrawer
