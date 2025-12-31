"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Cog6ToothIcon } from "@heroicons/react/24/outline"

export function AdminSettingsLink({ onClick }: { onClick?: () => void } = {}) {
  const pathname = usePathname()
  const active = pathname.startsWith("/admin/settings")

  return (
    <Link
      href="/admin/settings"
      onClick={onClick}
      className={`group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
        active
          ? "bg-gray-900 text-white shadow-sm"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      <Cog6ToothIcon
        className={`h-5 w-5 shrink-0 transition-colors ${
          active ? "text-white" : "text-gray-400 group-hover:text-gray-600"
        }`}
      />
      <span className="flex-1">Settings</span>
    </Link>
  )
}
