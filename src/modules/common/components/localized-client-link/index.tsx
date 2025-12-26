"use client"

import Link, { type LinkProps } from "next/link"
import { useRouter } from "next/navigation"
import React, { useCallback, useEffect, useRef } from "react"

/**
 * Use this component to create a Next.js `<Link />` that persists the current country code in the url,
 * without having to explicitly pass it as a prop.
 */
type PrefetchIntent = "viewport" | "hover" | "none"

type LocalizedClientLinkProps = Omit<LinkProps, "href"> & {
  children?: React.ReactNode
  href: string
  className?: string
  prefetchIntent?: PrefetchIntent
  onMouseEnter?: React.MouseEventHandler<HTMLAnchorElement>
  onFocus?: React.FocusEventHandler<HTMLAnchorElement>
}

const LocalizedClientLink = ({
  children,
  href,
  prefetchIntent = "viewport",
  onMouseEnter,
  onFocus,
  ...props
}: LocalizedClientLinkProps) => {
  const router = useRouter()
  const anchorRef = useRef<HTMLAnchorElement | null>(null)
  const prefetchedRef = useRef(false)
  const resolvedHref = href.startsWith("/") ? href : `/${href}`

  const triggerPrefetch = useCallback(() => {
    if (prefetchedRef.current || prefetchIntent === "none") {
      return
    }

    if (!resolvedHref) {
      return
    }

    try {
      const maybePromise = router.prefetch?.(resolvedHref) as Promise<unknown> | undefined
      if (maybePromise) {
        maybePromise.catch((error) => {
          if (process.env.NODE_ENV !== "production") {
            console.warn("Prefetch failed", error)
          }
        })
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Prefetch threw", error)
      }
    }
    prefetchedRef.current = true
  }, [prefetchIntent, resolvedHref, router])

  useEffect(() => {
    if (prefetchIntent !== "viewport" || typeof IntersectionObserver === "undefined") {
      return
    }

    const element = anchorRef.current
    if (!element || prefetchedRef.current) {
      return
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          triggerPrefetch()
          observer.disconnect()
        }
      })
    })

    observer.observe(element)

    return () => observer.disconnect()
  }, [prefetchIntent, triggerPrefetch])

  const handleMouseEnter = useCallback<React.MouseEventHandler<HTMLAnchorElement>>(
    (event) => {
      onMouseEnter?.(event)
      if (prefetchIntent === "hover") {
        triggerPrefetch()
      }
    },
    [onMouseEnter, prefetchIntent, triggerPrefetch],
  )

  const handleFocus = useCallback<React.FocusEventHandler<HTMLAnchorElement>>(
    (event) => {
      onFocus?.(event)
      if (prefetchIntent === "hover") {
        triggerPrefetch()
      }
    },
    [onFocus, prefetchIntent, triggerPrefetch],
  )

  return (
    <Link
      {...props}
      href={resolvedHref}
      prefetch={false}
      ref={anchorRef}
      onMouseEnter={handleMouseEnter}
      onFocus={handleFocus}
    >
      {children}
    </Link>
  )
}

export default LocalizedClientLink
