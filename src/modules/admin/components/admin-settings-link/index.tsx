"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Cog6ToothIcon } from "@heroicons/react/24/outline"

export function AdminSettingsLink() {
  const pathname = usePathname()
  const active = pathname.startsWith("/admin/settings")

  return (
    <Link
      href="/admin/settings"
      className={`group flex items-center px-3 py-2 text-[14px] font-medium rounded-lg transition-colors active:scale-[0.98] active:opacity-90 ${
        active
          ? "bg-white/[0.12] text-white"
          : "text-[#a6acb2] hover:bg-white/[0.08] hover:text-gray-100"
      }`}
    >
      <Cog6ToothIcon
        className={`mr-3 h-5 w-5 transition-colors ${
          active ? "text-white" : "text-[#8c9196] group-hover:text-gray-100"
        }`}
      />
      Settings
    </Link>
  )
}
