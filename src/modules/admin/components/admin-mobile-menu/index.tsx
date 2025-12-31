"use client"

import { useState } from "react"
import Link from "next/link"
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline"
import { AdminSidebarNav } from "../admin-sidebar-nav"
import { AdminSettingsLink } from "../admin-settings-link"
import {
  ArrowLeftOnRectangleIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline"
import { signout } from "@lib/data/customer"

export function AdminMobileMenu() {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={toggleMenu}
        className="lg:hidden relative w-10 h-10 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <XMarkIcon className="w-6 h-6" />
        ) : (
          <Bars3Icon className="w-6 h-6" />
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 lg:hidden"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-[60] w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close Button */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 shrink-0">
          <Link
            href="/admin"
            onClick={closeMenu}
            className="flex items-center gap-3"
          >
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs">
              T
            </div>
            <span className="font-semibold text-base text-gray-900">Toycker</span>
          </Link>
          <button
            onClick={closeMenu}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <AdminSidebarNav onItemClick={closeMenu} />
        </nav>

        {/* Bottom Section */}
        <div className="p-3 border-t border-gray-200 space-y-1 shrink-0">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={closeMenu}
            className="group flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-all"
          >
            <div className="h-5 w-5 rounded-md bg-gray-100 group-hover:bg-white flex items-center justify-center">
              <div className="h-1.5 w-1.5 rounded-full bg-gray-400 group-hover:bg-gray-600" />
            </div>
            <span className="flex-1">Online Store</span>
            <ArrowTopRightOnSquareIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600 opacity-60 group-hover:opacity-100 transition-all" />
          </Link>
          <div className="h-px bg-gray-200 my-2" />
          <AdminSettingsLink onClick={closeMenu} />
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
      </div>
    </>
  )
}
