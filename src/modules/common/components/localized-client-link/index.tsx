"use client"

import Link, { type LinkProps } from "next/link"
import React from "react"

/**
 * Simplified link component for single-region store.
 * Wraps Next.js Link directly.
 */
type LocalizedClientLinkProps = Omit<LinkProps, "href"> & {
  children?: React.ReactNode
  href: string
  className?: string
  prefetchIntent?: "viewport" | "hover" | "none" // Kept for compatibility but not actively used
  onMouseEnter?: React.MouseEventHandler<HTMLAnchorElement>
  onFocus?: React.FocusEventHandler<HTMLAnchorElement>
}

const LocalizedClientLink = ({
  children,
  href,
  prefetchIntent,
  ...props
}: LocalizedClientLinkProps) => {
  const resolvedHref = href.startsWith("/") ? href : `/${href}`

  return (
    <Link
      {...props}
      href={resolvedHref}
    >
      {children}
    </Link>
  )
}

export default LocalizedClientLink