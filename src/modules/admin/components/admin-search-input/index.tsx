"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline"
import { cn } from "@lib/util/cn"

interface AdminSearchInputProps {
  defaultValue: string
  status: string
}

export function AdminSearchInput({ defaultValue, status }: AdminSearchInputProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(defaultValue)

  // Debounced search - triggers 500ms after typing stops
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams)
      params.set("status", status)
      params.delete("page") // Reset to page 1 on search

      if (value.trim()) {
        params.set("search", value.trim())
      } else {
        params.delete("search")
      }

      const queryString = params.toString()
      router.push(queryString ? `/admin/products?${queryString}` : "/admin/products")
    }, 500)

    return () => clearTimeout(timer)
  }, [value, status, router, searchParams])

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
            placeholder="Search products by name or handle..."
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
