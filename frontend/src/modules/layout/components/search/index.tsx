"use client"

import { useState, useRef, useEffect } from "react"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import { useAnimatedPlaceholder } from "@modules/layout/hooks/useAnimatedPlaceholder"

type SearchProps = {
  className?: string
  placeholder?: string
  enableAnimation?: boolean
  animationPhrases?: string[]
  onActivate?: () => void
}

const defaultSearchSuggestions = [
  "What are you looking for?",
  "Search for toys...",
  "Find building blocks...",
  "Discover action figures...",
  "Browse educational toys...",
  "Explore outdoor games...",
]

const Search = ({
  className = "",
  placeholder = "Search products...",
  enableAnimation = true,
  animationPhrases = defaultSearchSuggestions,
  onActivate,
}: SearchProps) => {
  const [isFocused, setIsFocused] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  const shouldAnimate = enableAnimation && !isFocused && !prefersReducedMotion

  const animatedPlaceholder = useAnimatedPlaceholder({
    phrases: animationPhrases,
    typingSpeed: 70,
    deletingSpeed: 40,
    pauseDuration: 2500,
    enabled: shouldAnimate,
  })

  const displayPlaceholder = shouldAnimate ? animatedPlaceholder : placeholder

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleBlur = () => {
    setIsFocused(false)
  }

  const handleTrigger = () => {
    onActivate?.()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      handleTrigger()
    }
  }

  return (
    <div className={`relative flex-1 max-w-xl ${className}`}>
      <div className="relative flex items-center">
        <label htmlFor="search-input" className="sr-only">
          Search for toys and products
        </label>
        <div className="absolute left-2 w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
          <MagnifyingGlassIcon className="w-5 h-5 text-white" />
        </div>
        <input
          ref={inputRef}
          id="search-input"
          type="text"
          readOnly
          onFocus={handleFocus}
          onBlur={handleBlur}
          onClick={handleTrigger}
          onKeyDown={handleKeyDown}
          placeholder={displayPlaceholder}
          className="w-full cursor-pointer py-3 pl-14 pr-4 bg-white rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
          aria-label="Open search"
        />
      </div>
    </div>
  )
}

export default Search
