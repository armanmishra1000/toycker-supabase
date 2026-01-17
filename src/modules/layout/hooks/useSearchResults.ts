"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useDebounce } from "@/lib/hooks/use-debounce"
import type { SearchResultsPayload } from "@lib/data/search"
import { resizeImage } from "@/lib/util/image-processing"

type SearchStatus = "idle" | "loading" | "success" | "error"

type UseSearchResultsArgs = {
  countryCode?: string
  productLimit?: number
  taxonomyLimit?: number
}

export const useSearchResults = ({
  countryCode,
  productLimit = 6,
  taxonomyLimit = 5,
}: UseSearchResultsArgs) => {
  const [query, setQuery] = useState("")
  const debouncedQuery = useDebounce(query.trim(), 200)
  const [results, setResults] = useState<SearchResultsPayload | null>(null)
  const [status, setStatus] = useState<SearchStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const cacheRef = useRef<Map<string, SearchResultsPayload>>(new Map())
  const fetchIdRef = useRef(0)


  useEffect(() => {
    if (!debouncedQuery) {
      setResults(null)
      setStatus("idle")
      setError(null)
      return
    }

    if (!countryCode) {
      setError("Missing country context")
      setStatus("error")
      return
    }

    const cacheKey = `${countryCode}|${debouncedQuery.toLowerCase()}|${productLimit}|${taxonomyLimit}`
    const cached = cacheRef.current.get(cacheKey)

    if (cached) {
      setResults(cached)
      setStatus("success")
    }

    const currentFetchId = fetchIdRef.current + 1
    fetchIdRef.current = currentFetchId
    let isActive = true

    setError(null)
    if (!cached) {
      setStatus("loading")
    }

    const fetchResults = async () => {
      try {
        const params = new URLSearchParams({
          q: debouncedQuery,
          countryCode,
          productLimit: String(productLimit),
          taxonomyLimit: String(taxonomyLimit),
        })

        const response = await fetch(`/api/storefront/search?${params.toString()}`)

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as {
            message?: string
          }
          throw new Error(payload.message || "Unable to fetch search results")
        }

        const payload = (await response.json()) as SearchResultsPayload
        cacheRef.current.set(cacheKey, payload)

        if (!isActive || fetchIdRef.current !== currentFetchId) {
          return
        }

        setResults(payload)
        setStatus("success")
      } catch (fetchError) {
        if (!isActive || fetchIdRef.current !== currentFetchId) {
          return
        }

        setError(fetchError instanceof Error ? fetchError.message : "Unexpected error")
        setStatus("error")
      }
    }

    fetchResults()

    return () => {
      isActive = false
    }
  }, [countryCode, debouncedQuery, productLimit, taxonomyLimit])

  const clear = () => {
    setQuery("")
    setResults(null)
    setStatus("idle")
    setError(null)
  }

  const isEmpty = useMemo(() => {
    if (!results) {
      return false
    }

    return (
      results.products.length === 0 &&
      results.categories.length === 0 &&
      results.collections.length === 0
    )
  }, [results])

  const searchByImage = async (file: File) => {

    setStatus("loading")
    setError(null)
    setQuery("") // Clear text query when starting image search

    try {
      const processedBlob = await resizeImage(file, 800) // 800px is a good balance for CLIP
      const formData = new FormData()
      formData.append("image", processedBlob, "search.jpg")

      const response = await fetch("/api/storefront/search/image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          message?: string
          error?: string
        }
        throw new Error(payload.error || payload.message || "Unable to fetch image search results")
      }

      const payload = (await response.json()) as SearchResultsPayload
      setResults({
        ...payload,
        categories: [],
        collections: [],
        suggestions: [],
      })
      setStatus("success")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error")
      setStatus("error")
    }
  }

  return {
    query,
    setQuery,
    clear,
    status,
    error,
    results,
    suggestions: results?.suggestions ?? [],
    hasTypedQuery: Boolean(query.trim()),
    isEmpty,
    searchByImage,
  }
}

