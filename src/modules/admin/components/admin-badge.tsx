import React from "react"
import { cn } from "@lib/util/cn"

type AdminBadgeVariant = "success" | "warning" | "error" | "info" | "neutral"

type AdminBadgeProps = {
  children: React.ReactNode
  variant?: AdminBadgeVariant
}

const AdminBadge = ({ children, variant = "neutral" }: AdminBadgeProps) => {
  const variants = {
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-800",
    error: "bg-rose-100 text-rose-800",
    info: "bg-blue-100 text-blue-800",
    neutral: "bg-gray-100 text-gray-800",
  }

  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", variants[variant])}>
      {children}
    </span>
  )
}

export default AdminBadge