import React from "react"
import { cn } from "@lib/util/cn"

type AdminCardProps = {
  children: React.ReactNode
  title?: string
  footer?: React.ReactNode
  className?: string
}

const AdminCard = ({ children, title, footer, className }: AdminCardProps) => {
  return (
    <div className={cn("bg-white rounded-xl border border-admin-border shadow-[0_1px_3px_0_rgba(0,0,0,0.08)] overflow-hidden", className)}>
      {title && (
        <div className="px-5 py-4 border-b border-admin-border bg-gray-50/50">
          <h3 className="text-[13px] font-semibold text-admin-text-primary">{title}</h3>
        </div>
      )}
      <div className="p-5">
        {children}
      </div>
      {footer && (
        <div className="px-5 py-4 bg-gray-50 border-t border-admin-border flex justify-end items-center gap-3">
          {footer}
        </div>
      )}
    </div>
  )
}

export default AdminCard