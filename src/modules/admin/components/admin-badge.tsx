import React from "react"
import { cn } from "@lib/util/cn"

type AdminBadgeVariant = "success" | "warning" | "error" | "info" | "neutral"

type AdminBadgeProps = {
  children: React.ReactNode
  variant?: AdminBadgeVariant
}

const AdminBadge = ({ children, variant = "neutral" }: AdminBadgeProps) => {
  const variants = {
    success: "bg-[#e3f9e5] text-[#1a7a22]",
    warning: "bg-[#fff4e5] text-[#b45309]",
    error: "bg-[#fff1f0] text-[#cf1322]",
    info: "bg-[#e6f4ff] text-[#0958d9]",
    neutral: "bg-[#f5f5f5] text-[#595959]",
  }

  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-tight", variants[variant])}>
      {children}
    </span>
  )
}

export default AdminBadge