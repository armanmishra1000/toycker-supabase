import Link from "next/link"
import React from "react"
import { ArrowLeftIcon } from "@heroicons/react/24/outline"

type AdminPageHeaderProps = {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  backHref?: string
}

const AdminPageHeader = ({ title, subtitle, actions, backHref }: AdminPageHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        {backHref && (
          <Link
            href={backHref}
            className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
        )}
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
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