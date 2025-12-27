import React from "react"

type AdminPageHeaderProps = {
  title: string
  actions?: React.ReactNode
}

const AdminPageHeader = ({ title, actions }: AdminPageHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-8">
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  )
}

export default AdminPageHeader