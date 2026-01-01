"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline"

interface AdminSearchInputProps {
  defaultValue: string
  basePath: string
  placeholder?: string
}

export function AdminSearchInput({ defaultValue, basePath, placeholder = "Search by name or handle..." }: AdminSearchInputProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(defaultValue)
  const staticParamsRef = useRef<Record<string, string> | null>(null)

  // Initialize static params only once on mount
  if (staticParamsRef.current === null) {
    const params: Record<string, string> = {}
    for (const [key, val] of Array.from(searchParams.entries())) {
      if (key !== "search" && key !== "page") {
        params[key] = val
      }
    }
    staticParamsRef.current = params
  }

  // Debounced search - triggers 500ms after typing stops
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams()

      // Copy static params (like status) that were set when component mounted
      if (staticParamsRef.current) {
        for (const [key, val] of Object.entries(staticParamsRef.current)) {
          params.set(key, val)
        }
      }

      // Set the new search value (or don't set it if empty)
      if (value.trim()) {
        params.set("search", value.trim())
      }

      const queryString = params.toString()
      router.push(queryString ? `${basePath}?${queryString}` : basePath)
    }, 500)

    return () => clearTimeout(timer)
  }, [value, basePath, router])

  // Sync input value when defaultValue changes (e.g., when navigating with URL params)
  useEffect(() => {
    setValue(defaultValue)
  }, [defaultValue])

  const handleClear = useCallback(() => {
    setValue("")
  }, [])

  const hasSearch = value.trim().length > 0

  return (
    <div className="bg-white rounded-xl border border-admin-border p-4 shadow-sm">
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full h-10 pl-10 pr-10 text-sm bg-gray-100 border-transparent rounded-lg focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-gray-100 focus:outline-none transition-all placeholder:text-gray-400"
          />
          {hasSearch && (
            <button
              onClick={handleClear}
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
              title="Clear search"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
