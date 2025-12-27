import React from "react"

type AdminPageHeaderProps = {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

const AdminPageHeader = ({ title, subtitle, actions }: AdminPageHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  )
}

export default AdminPageHeader