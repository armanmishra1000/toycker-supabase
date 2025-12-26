"use client"

import { useRef, useState } from "react"
import { XMarkIcon, ChevronDownIcon } from "@heroicons/react/24/outline"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useOnClickOutside } from "@modules/layout/hooks/useOnClickOutside"
import { NavLink, ShopMenuPromo, ShopMenuSection } from "@modules/layout/config/navigation"
import { useBodyScrollLock } from "@modules/layout/hooks/useBodyScrollLock"

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
  shopMenuPromo,
}: MobileMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  
  useOnClickOutside(menuRef, onClose)

  // Lock body scroll when menu is open
  useBodyScrollLock({ isLocked: isOpen })

  const toggleDropdown = (id: string) => {
    setOpenDropdownId((prev) => (prev === id ? null : id))
  }

  const isDropdownOpen = (id: string) => openDropdownId === id

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Mobile Menu - Left Slide */}
      <div
        ref={menuRef}
        className={`fixed left-0 top-0 h-screen w-80 bg-white z-50 transform transition-transform duration-300 ease-out will-change-transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } flex flex-col overflow-hidden`}
        style={{ backfaceVisibility: "hidden" }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
          <h2 className="text-lg font-semibold font-grandstander">Menu</h2>
          <button
            onClick={onClose}
            className="hover:text-primary rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto">
          <ul className="flex flex-col gap-1 p-2">
            {navLinks.map((link) => (
              <li key={link.id}>
                {link.hasDropdown ? (
                  <div>
                    <button
                      onClick={() => toggleDropdown(link.id)}
                      className="w-full flex items-center justify-between py-3 px-4 text-base font-medium hover:bg-gray-50 transition-colors"
                    >
                      <span>{link.label}</span>
                      <ChevronDownIcon
                        className={`w-4 h-4 transition-transform duration-300 ${
                          isDropdownOpen(link.id) ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Dropdown Items */}
                    {isDropdownOpen(link.id) && (
                      <div className="bg-gray-50 flex flex-col gap-1 p-2">
                        {shopMenuSections.map((section) => (
                          <div key={section.id} className="px-2 py-2">
                            <p className="px-6 text-xs font-semibold uppercase tracking-wide text-gray-500">
                              {section.title}
                            </p>
                            <div className="mt-1 flex flex-col">
                              {section.items.map((item) => (
                                <LocalizedClientLink
                                  key={item.id}
                                  href={item.href}
                                  onClick={onClose}
                                  className="block py-2 pl-8 pr-4 text-sm hover:bg-primary hover:text-white transition-colors"
                                >
                                  {item.label}
                                </LocalizedClientLink>
                              ))}
                            </div>
                          </div>
                        ))}

                        <div className="rounded-2xl bg-rose-50 p-4">
                          <div className="space-y-2">
                            {shopMenuPromo.links.map((link, index) => (
                              <LocalizedClientLink
                                key={link.id}
                                href={link.href}
                                onClick={onClose}
                                className={`${
                                  index === 0
                                    ? "block rounded-full bg-primary px-4 py-2 text-center text-sm font-semibold text-white"
                                    : "block text-sm font-medium text-gray-800"
                                }`}
                              >
                                {link.label}
                              </LocalizedClientLink>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <LocalizedClientLink
                    href={link.href}
                    onClick={onClose}
                    className="block py-3 px-4 text-base font-medium hover:bg-gray-50 transition-colors"
                  >
                    {link.label}
                  </LocalizedClientLink>
                )}
              </li>
            ))}
            
            {/* Wishlist Link - No Icon */}
            <li>
              <LocalizedClientLink 
                href="/wishlist" 
                onClick={onClose}
                className="block py-3 px-4 text-base font-medium hover:bg-gray-50 transition-colors"
              >
                Wishlist
              </LocalizedClientLink>
            </li>
          </ul>
        </nav>

        {/* Login Button */}
        <div className="px-4 pb-4">
          <LocalizedClientLink href="/account" onClick={onClose}>
            <button className="w-full py-3 px-4 bg-primary text-white rounded-lg font-medium hover:bg-opacity-90 transition-all">
              Login / Sign Up
            </button>
          </LocalizedClientLink>
        </div>
      </div>
    </>
  )
}

export default MobileMenu
