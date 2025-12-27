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
    <div className={cn("bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden", className)}>
      {title && (
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">{title}</h3>
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
      {footer && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end items-center gap-3">
          {footer}
        </div>
      )}
    </div>
  )
}

export default AdminCard