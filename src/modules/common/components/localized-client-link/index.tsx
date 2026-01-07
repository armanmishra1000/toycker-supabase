"use client"

import Link, { type LinkProps } from "next/link"
import React from "react"
import { cn } from "@lib/util/cn"

/**
 * Simplified link component for single-region store.
 * Wraps Next.js Link directly with click feedback.
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
  className,
  ...props
}: LocalizedClientLinkProps) => {
  const resolvedHref = href.startsWith("/") ? href : `/${href}`

  return (
    <Link
      {...props}
      href={resolvedHref}
      className={className}
    >
      {children}
    </Link>
  )
}

export default LocalizedClientLink