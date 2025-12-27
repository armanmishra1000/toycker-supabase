"use client"

import React from "react"
import { cn } from "@lib/util/cn"

type SafeRichTextProps = {
  html?: string | null
  className?: string
}

const SafeRichText = ({ html, className }: SafeRichTextProps) => {
  if (!html) {
    return null
  }

  // Directly rendering HTML as it comes from our trusted Supabase backend
  return (
    <div
      className={cn("prose prose-sm max-w-none text-ui-fg-subtle", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export default SafeRichText