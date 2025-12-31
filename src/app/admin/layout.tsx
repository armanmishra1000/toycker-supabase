import React from "react"
import Link from "next/link"
import {
  ArrowLeftOnRectangleIcon,
  ArrowTopRightOnSquareIcon,
  MagnifyingGlassIcon,
  BellIcon,
} from "@heroicons/react/24/outline"
import { signout } from "@lib/data/customer"
import { ensureAdmin, getAdminUser } from "@/lib/data/admin"
import { AdminSidebarNav } from "@modules/admin/components/admin-sidebar-nav"
import { AdminSettingsLink } from "@modules/admin/components/admin-settings-link"
import { AdminMobileMenu } from "@modules/admin/components/admin-mobile-menu"

export const metadata = {
  title: "Toycker Admin",
  description: "Store Management",
}

export const revalidate = 30

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await ensureAdmin()
  const adminUser = await getAdminUser()

  // Generate initials from name or email
  const getInitials = (firstName: string, lastName: string, email: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase()
    }
    if (firstName) {
      return firstName.slice(0, 2).toUpperCase()
    }
    if (email) {
      return email.slice(0, 2).toUpperCase()
    }
    return "AD"
  }

  const getDisplayName = (firstName: string, lastName: string) => {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`
    }
    if (firstName) {
      return firstName
    }
    return "Admin"
  }

  const initials = adminUser
    ? getInitials(adminUser.firstName, adminUser.lastName, adminUser.email)
    : "AD"
  const displayName = adminUser
    ? getDisplayName(adminUser.firstName, adminUser.lastName)
    : "Admin"
  const email = adminUser?.email || ""

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-[260px_1fr] min-h-screen bg-gray-50 font-sans">
      {/* Desktop Sidebar - Hidden on mobile, visible on lg+ */}
      <aside className="hidden lg:flex bg-white border-r border-gray-200 flex-col sticky top-0 h-screen overflow-hidden">
        {/* Logo Section */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200 shrink-0">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/30 transition-all">
              T
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base text-gray-900 leading-tight">Toycker</span>
              <span className="text-[11px] text-gray-500 font-medium tracking-wide">ADMIN</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 overflow-y-auto overflow-x-hidden">
          <AdminSidebarNav />
        </nav>

        {/* Bottom Section */}
        <div className="p-3 border-t border-gray-200 space-y-1 shrink-0">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-all"
          >
            <div className="h-5 w-5 rounded-md bg-gray-100 group-hover:bg-white flex items-center justify-center">
              <div className="h-1.5 w-1.5 rounded-full bg-gray-400 group-hover:bg-gray-600" />
            </div>
            <span className="flex-1">Online Store</span>
            <ArrowTopRightOnSquareIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600 opacity-60 group-hover:opacity-100 transition-all" />
          </Link>
          <div className="h-px bg-gray-200 my-2" />
          <AdminSettingsLink />
          <form action={signout}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all"
            >
              <ArrowLeftOnRectangleIcon className="h-5 w-5" />
              <span>Log out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 h-screen overflow-hidden">
        {/* Sticky Top Header */}
        <header className="shrink-0 h-16 bg-white border-b border-gray-200">
          <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
            {/* Left: Mobile Menu Toggle & Search */}
            <div className="flex items-center gap-3 flex-1">
              <AdminMobileMenu />

              {/* Mobile Logo */}
              <Link href="/admin" className="lg:hidden flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs">
                  T
                </div>
                <span className="font-semibold text-sm text-gray-900">Toycker</span>
              </Link>

              {/* Search - Hidden on smallest screens */}
              <div className="hidden sm:block flex-1 max-w-xl">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="search"
                    placeholder="Search products, orders, customers..."
                    className="w-full h-10 pl-10 pr-4 text-sm bg-gray-100 border-transparent rounded-lg focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-gray-100 focus:outline-none transition-all placeholder:text-gray-400"
                  />
                  <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-200 rounded">
                    ⌘K
                  </kbd>
                </div>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <button className="relative h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all">
                <BellIcon className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-2 w-2 rounded-full bg-red-500" />
              </button>

              <div className="hidden sm:block h-6 w-px bg-gray-200" />

              <button className="flex items-center gap-2 px-2 py-2 sm:px-3 rounded-lg hover:bg-gray-100 transition-all">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                  {initials}
                </div>
                <div className="hidden xl:flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-700">{displayName}</span>
                  <span className="text-[11px] text-gray-400">{email}</span>
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
          {children}
        </div>
      </div>
    </div>
  )
}