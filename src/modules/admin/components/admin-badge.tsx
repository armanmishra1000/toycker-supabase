import React from "react"
import { cn } from "@lib/util/cn"

type AdminBadgeVariant = "success" | "warning" | "error" | "info" | "neutral" | "critical" | "caution"

type AdminBadgeProps = {
  children: React.ReactNode
  variant?: AdminBadgeVariant
}

const AdminBadge = ({ children, variant = "neutral" }: AdminBadgeProps) => {
  const variants = {
    // Polaris Tones
    success: "bg-[#cdfee1] text-[#0d3f1f] border border-[#aee9c5]", // Green
    warning: "bg-[#fff1d7] text-[#5e4200] border border-[#faddaa]", // Orange/Yellow
    critical: "bg-[#ffdcd9] text-[#5c1810] border border-[#fccfcd]", // Red
    error: "bg-[#ffdcd9] text-[#5c1810] border border-[#fccfcd]", // Red (alias for critical)
    info: "bg-[#c9e8fc] text-[#0d3d69] border border-[#b4dcff]", // Blue
    neutral: "bg-[#e4e5e7] text-[#303030] border border-[#d3d4d6]", // Gray
    caution: "bg-[#fff1d7] text-[#5e4200] border border-[#faddaa]", // Yellow (alias for warning)
  }

  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium", variants[variant])}>
      {children}
    </span>
  )
}

export default AdminBadge