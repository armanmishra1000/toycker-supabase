import React from "react"
import Link from "next/link"
import {
  ArrowLeftOnRectangleIcon,
  ArrowTopRightOnSquareIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline"
import { signout } from "@lib/data/customer"
import { ensureAdmin } from "@/lib/data/admin"
import { AdminSidebarNav } from "@modules/admin/components/admin-sidebar-nav"
import { AdminSettingsLink } from "@modules/admin/components/admin-settings-link"

export const metadata = {
  title: "Toycker Admin",
  description: "Store Management",
}

export const revalidate = 30

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await ensureAdmin()

  return (
    <div className="min-h-screen bg-admin-bg flex font-sans text-admin-text-primary">
      {/* Sidebar */}
      <aside className="w-60 bg-admin-sidebar flex flex-col fixed inset-y-0 z-50 transition-all duration-300">
        <div className="h-14 flex items-center px-4 bg-admin-sidebar shrink-0">
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors w-full cursor-pointer">
            <div className="h-8 w-8 rounded bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">T</div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-gray-100 leading-tight">Toycker</span>
              <span className="text-[11px] text-gray-400 font-medium">Store Admin</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          <AdminSidebarNav />
          <Link
            href="/"
            target="_blank"
            className="group flex items-center px-3 py-2 text-[14px] font-medium rounded-lg transition-all text-[#a6acb2] hover:bg-white/[0.08] hover:text-gray-100 active:scale-[0.98] active:opacity-90"
          >
            <div className="mr-3 h-5 w-5 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full border border-[#8c9196] group-hover:border-gray-100" />
            </div>
            Online Store
            <ArrowTopRightOnSquareIcon className="ml-auto h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </nav>

        <div className="p-2 border-t border-white/[0.08] space-y-1">
          <AdminSettingsLink />
          <form action={signout}>
            <button className="flex items-center w-full px-3 py-2 text-[14px] font-medium rounded-lg text-[#a6acb2] hover:bg-white/[0.08] hover:text-gray-100 transition-all active:scale-[0.98] active:opacity-90">
              <ArrowLeftOnRectangleIcon className="mr-3 h-5 w-5 text-[#8c9196] group-hover:text-gray-100" />
              Log out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-60 min-h-screen flex flex-col">
        {/* Top Navbar */}
        <header className="h-14 bg-white border-b border-admin-border sticky top-0 z-40 flex items-center justify-between px-6 shrink-0">
          <div className="flex-1 max-w-lg">
            <div className="relative group">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
              <input
                type="search"
                placeholder="Search"
                className="w-full bg-[#f1f2f4] border border-transparent hover:border-[#d3d4d6] rounded-lg py-1.5 pl-9 pr-4 text-sm focus:bg-white focus:border-black focus:ring-0 transition-all placeholder:text-gray-500"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <div className="px-1.5 py-0.5 rounded border border-gray-200 bg-white text-[10px] font-medium text-gray-400">⌘ K</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="h-8 w-8 rounded-lg hover:bg-gray-50 flex items-center justify-center text-gray-500 transition-colors">
              <span className="sr-only">Notifications</span>
              <div className="h-5 w-5 rounded-full border-2 border-current p-0.5" />
            </button>
            <div className="h-8 w-8 rounded bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm cursor-pointer">
              NR
            </div>
          </div>
        </header>

        <div className="p-6 max-w-6xl mx-auto w-full flex-1">
          {children}
        </div>
      </main>
    </div>
  )
}