import React from "react"
import { cn } from "@lib/util/cn"

type AdminCardProps = {
  children: React.ReactNode
  title?: string
  className?: string
}

const AdminCard = ({ children, title, className }: AdminCardProps) => {
  return (
    <div className={cn("bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden", className)}>
      {title && (
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}

export default AdminCard