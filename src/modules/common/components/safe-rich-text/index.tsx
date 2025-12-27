"use client"

import React from "react"
import DOMPurify from "isomorphic-dompurify"
import { cn } from "@lib/util/cn"

type SafeRichTextProps = {
  html?: string | null
  className?: string
}

const SafeRichText = ({ html, className }: SafeRichTextProps) => {
  if (!html) {
    return null
  }

  const sanitizedHtml = DOMPurify.sanitize(html)

  return (
    <div
      className={cn("prose prose-sm max-w-none text-ui-fg-subtle", className)}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  )
}

export default SafeRichText