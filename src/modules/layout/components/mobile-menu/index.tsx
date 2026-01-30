"use client"


import { useState, useEffect } from "react"
import { XMarkIcon, ArrowLeftIcon } from "@heroicons/react/24/outline"
import { Sparkles } from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { NavLink, ShopMenuPromo, ShopMenuSection } from "@modules/layout/config/navigation"
import { useBodyScrollLock } from "@modules/layout/hooks/useBodyScrollLock"

type MenuView = {
  type: "main" | "shop" | "section"
  title: string
  section?: ShopMenuSection
}

type MobileMenuProps = {
  isOpen: boolean
  onClose: () => void
  navLinks: NavLink[]
  shopMenuSections: ShopMenuSection[]
  shopMenuPromo: ShopMenuPromo
}

const MobileMenu = ({
  isOpen,
  onClose,
  navLinks,
  shopMenuSections,
  shopMenuPromo: _shopMenuPromo,
}: MobileMenuProps) => {
  const [menuStack, setMenuStack] = useState<MenuView[]>([])

  useBodyScrollLock({ isLocked: isOpen })

  // Initialize menu stack when opened
  useEffect(() => {
    if (isOpen && menuStack.length === 0) {
      setMenuStack([{ type: "main", title: "Menu" }])
    }
    // Reset when closed
    if (!isOpen && menuStack.length > 0) {
      setMenuStack([])
    }
  }, [isOpen, menuStack.length])

  const viewCount = menuStack.length
  const currentView = menuStack[menuStack.length - 1]

  const navigateToShop = () => {
    setMenuStack((prev) => [...prev, { type: "shop", title: "Shop" }])
  }

  const navigateToSection = (section: ShopMenuSection) => {
    setMenuStack((prev) => [...prev, { type: "section", title: section.title, section }])
  }

  const goBack = () => {
    setMenuStack((prev) => prev.slice(0, -1))
  }

  const closeAll = () => {
    setMenuStack([])
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop - clicking closes menu */}
      <div
        className="fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300"
        onClick={closeAll}
      />

      {/* Drawer Container - Multiple drawers can exist */}
      <div className="fixed inset-0 z-[150] pointer-events-none">
        {/* Main Menu Drawer - Full screen on mobile */}
        <div
          className={`absolute left-0 top-0 h-full w-full sm:w-[85%] sm:max-w-sm bg-white shadow-2xl transform transition-transform duration-300 ease-out will-change-transform pointer-events-auto ${viewCount >= 1 ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          {/* Main Menu Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex justify-between items-center z-10">
            <h2 className="text-xl font-bold font-grandstander text-gray-900">
              Menu
            </h2>
            <button
              onClick={closeAll}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Main Menu Content */}
          <nav className="overflow-y-auto h-[calc(100vh-274px)]">
            <ul className="flex flex-col">
              {navLinks.filter(link => link.id !== 'club').map((link) => (
                <div key={link.id}>
                  <li className="border-b border-gray-100">
                    {link.hasDropdown ? (
                      <button
                        onClick={navigateToShop}
                        className="w-full flex items-center justify-between py-4 px-6 text-base font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                        aria-label={`Open ${link.label} menu`}
                      >
                        <span>{link.label}</span>
                        <span className="text-gray-400 text-2xl">›</span>
                      </button>
                    ) : (
                      <LocalizedClientLink
                        href={link.href}
                        onClick={closeAll}
                        className="block py-4 px-6 text-base font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                      >
                        {link.label}
                      </LocalizedClientLink>
                    )}
                  </li>

                  {/* Move Categories & Collections directly after Shop */}
                  {link.id === 'shop' && (
                    <>
                      <li className="border-b border-gray-100">
                        <LocalizedClientLink
                          href="/categories"
                          onClick={closeAll}
                          className="block py-4 px-6 text-base font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                        >
                          Categories
                        </LocalizedClientLink>
                      </li>
                      <li className="border-b border-gray-100">
                        <LocalizedClientLink
                          href="/collections"
                          onClick={closeAll}
                          className="block py-4 px-6 text-base font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                        >
                          Collections
                        </LocalizedClientLink>
                      </li>
                    </>
                  )}
                </div>
              ))}

              {/* Wishlist */}
              <li className="border-b border-gray-100">
                <LocalizedClientLink
                  href="/wishlist"
                  onClick={closeAll}
                  className="block py-4 px-6 text-base font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  Wishlist
                </LocalizedClientLink>
              </li>

              {/* Club (Last for mobile) */}
              {navLinks.find(l => l.id === 'club') && (
                <li className="border-b border-gray-100">
                  <LocalizedClientLink
                    href={(navLinks.find(l => l.id === 'club'))!.href}
                    onClick={closeAll}
                    className="block py-4 px-6 text-base font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    Club
                  </LocalizedClientLink>
                </li>
              )}
            </ul>
          </nav>

          {/* Fixed Bottom Section */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-20">
            {/* New Arrivals & Best Sellers */}
            <div className="flex gap-3 mb-3">
              <LocalizedClientLink
                href="/collections/new-arrivals"
                onClick={closeAll}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-900 rounded-lg font-medium text-center hover:bg-gray-200 transition-colors"
              >
                New Arrivals
              </LocalizedClientLink>
              <LocalizedClientLink
                href="/collections/best-selling"
                onClick={closeAll}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-900 rounded-lg font-medium text-center hover:bg-gray-200 transition-colors"
              >
                Best Sellers
              </LocalizedClientLink>
            </div>

            {/* Shop All Button */}
            <LocalizedClientLink
              href="/store"
              onClick={closeAll}
              className="block w-full py-3 px-4 bg-primary text-white rounded-lg font-bold text-center hover:bg-opacity-90 transition-all mb-3"
            >
              Shop All
            </LocalizedClientLink>

            {/* Login Button */}
            <LocalizedClientLink href="/account" onClick={closeAll}>
              <button className="w-full py-3 px-4 bg-gray-900 text-white rounded-lg font-semibold hover:bg-opacity-90 transition-all">
                Login / Sign Up
              </button>
            </LocalizedClientLink>
          </div>
        </div>

        {/* Shop Drawer - Opens when clicking Shop */}
        <div
          className={`absolute left-0 top-0 h-full w-full sm:w-[85%] sm:max-w-sm bg-white shadow-2xl transform transition-transform duration-300 ease-out will-change-transform pointer-events-auto ${viewCount >= 2 ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          {currentView?.type === "shop" ? (
            <>
              {/* Shop Drawer Header with Back Button */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3 z-10">
                <button
                  onClick={goBack}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                  aria-label="Go back to main menu"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold font-grandstander text-gray-900">
                  Shop
                </h2>
              </div>

              {/* Shop Menu Content */}
              <nav className="overflow-y-auto h-[calc(100vh-73px)]">
                <ul className="flex flex-col">
                  {shopMenuSections.map((section) => (
                    <li key={section.id} className="border-b border-gray-100">
                      <button
                        onClick={() => navigateToSection(section)}
                        className="w-full flex items-center justify-between py-4 px-6 text-base font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                        aria-label={`Open ${section.title} menu`}
                      >
                        <span>{section.title}</span>
                        <span className="text-gray-400 text-2xl">›</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </>
          ) : null}
        </div>

        {/* Section Drawer - Opens when clicking a section */}
        <div
          className={`absolute left-0 top-0 h-full w-full sm:w-[85%] sm:max-w-sm bg-white shadow-2xl transform transition-transform duration-300 ease-out will-change-transform pointer-events-auto ${viewCount >= 3 ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          {currentView?.type === "section" && currentView.section ? (
            <>
              {/* Section Drawer Header with Back Button */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3 z-10">
                <button
                  onClick={goBack}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                  aria-label="Go back to shop menu"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold font-grandstander text-gray-900">
                  {currentView.section.title}
                </h2>
              </div>

              {/* Section Menu Content */}
              <nav className="overflow-y-auto h-[calc(100vh-73px)]">
                <ul className="flex flex-col">
                  {currentView.section.items.map((item) => (
                    <li key={item.id} className="border-b border-gray-100">
                      <LocalizedClientLink
                        href={item.href}
                        onClick={closeAll}
                        className="block py-4 px-6 text-base font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                      >
                        {item.label}
                      </LocalizedClientLink>
                    </li>
                  ))}

                  {currentView.section.extraLinks && currentView.section.extraLinks.length > 0 && (
                    <>
                      <li className="mt-4 px-6 py-2 bg-gray-50 text-[10px] uppercase font-bold text-gray-400 tracking-widest border-y border-gray-100">
                        Quick Links
                      </li>
                      {currentView.section.extraLinks.map((link) => (
                        <li key={link.id} className="border-b border-gray-100">
                          <LocalizedClientLink
                            href={link.href}
                            onClick={closeAll}
                            className="block py-4 px-6 text-base font-bold text-primary hover:bg-gray-50 transition-colors"
                          >
                            {link.label}
                          </LocalizedClientLink>
                        </li>
                      ))}
                    </>
                  )}
                </ul>
              </nav>
            </>
          ) : null}
        </div>
      </div>
    </>
  )
}

export default MobileMenu
