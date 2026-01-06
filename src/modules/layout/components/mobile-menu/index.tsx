// "use client"

// import { useRef, useState } from "react"
// import { XMarkIcon, ChevronDownIcon } from "@heroicons/react/24/outline"
// import LocalizedClientLink from "@modules/common/components/localized-client-link"
// import { useOnClickOutside } from "@modules/layout/hooks/useOnClickOutside"
// import { NavLink, ShopMenuPromo, ShopMenuSection } from "@modules/layout/config/navigation"
// import { useBodyScrollLock } from "@modules/layout/hooks/useBodyScrollLock"

// type MobileMenuProps = {
//   isOpen: boolean
//   onClose: () => void
//   navLinks: NavLink[]
//   shopMenuSections: ShopMenuSection[]
//   shopMenuPromo: ShopMenuPromo
// }

// const MobileMenu = ({
//   isOpen,
//   onClose,
//   navLinks,
//   shopMenuSections,
//   shopMenuPromo,
// }: MobileMenuProps) => {
//   const menuRef = useRef<HTMLDivElement>(null)
//   const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)

//   useOnClickOutside(menuRef, onClose)

//   // Lock body scroll when menu is open
//   useBodyScrollLock({ isLocked: isOpen })

//   const toggleDropdown = (id: string) => {
//     setOpenDropdownId((prev) => (prev === id ? null : id))
//   }

//   const isDropdownOpen = (id: string) => openDropdownId === id

//   if (!isOpen) return null

//   return (
//     <>
//       {/* Backdrop */}
//       <div
//         className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
//           isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
//         }`}
//       />

//       {/* Mobile Menu - Left Slide */}
//       <div
//         ref={menuRef}
//         className={`fixed left-0 top-0 h-screen w-80 bg-white z-50 transform transition-transform duration-300 ease-out will-change-transform ${
//           isOpen ? "translate-x-0" : "-translate-x-full"
//         } flex flex-col overflow-hidden`}
//         style={{ backfaceVisibility: "hidden" }}
//       >
//         {/* Header */}
//         <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
//           <h2 className="text-lg font-semibold font-grandstander">Menu</h2>
//           <button
//             onClick={onClose}
//             className="hover:text-primary rounded-lg transition-colors"
//             aria-label="Close menu"
//           >
//             <XMarkIcon className="w-5 h-5" />
//           </button>
//         </div>

//         {/* Navigation - Scrollable */}
//         <nav className="flex-1 overflow-y-auto">
//           <ul className="flex flex-col gap-1 p-2">
//             {navLinks.map((link) => (
//               <li key={link.id}>
//                 {link.hasDropdown ? (
//                   <div>
//                     <button
//                       onClick={() => toggleDropdown(link.id)}
//                       className="w-full flex items-center justify-between py-3 px-4 text-base font-medium hover:bg-gray-50 transition-colors"
//                     >
//                       <span>{link.label}</span>
//                       <ChevronDownIcon
//                         className={`w-4 h-4 transition-transform duration-300 ${
//                           isDropdownOpen(link.id) ? "rotate-180" : ""
//                         }`}
//                       />
//                     </button>

//                     {/* Dropdown Items */}
//                     {isDropdownOpen(link.id) && (
//                       <div className="bg-gray-50 flex flex-col gap-1 p-2">
//                         {shopMenuSections.map((section) => (
//                           <div key={section.id} className="px-2 py-2">
//                             <p className="px-6 text-xs font-semibold uppercase tracking-wide text-gray-500">
//                               {section.title}
//                             </p>
//                             <div className="mt-1 flex flex-col">
//                               {section.items.map((item) => (
//                                 <LocalizedClientLink
//                                   key={item.id}
//                                   href={item.href}
//                                   onClick={onClose}
//                                   className="block py-2 pl-8 pr-4 text-sm hover:bg-primary hover:text-white transition-colors"
//                                 >
//                                   {item.label}
//                                 </LocalizedClientLink>
//                               ))}
//                             </div>
//                           </div>
//                         ))}

//                         <div className="rounded-2xl bg-rose-50 p-4">
//                           <div className="space-y-2">
//                             {shopMenuPromo.links.map((link, index) => (
//                               <LocalizedClientLink
//                                 key={link.id}
//                                 href={link.href}
//                                 onClick={onClose}
//                                 className={`${
//                                   index === 0
//                                     ? "block rounded-full bg-primary px-4 py-2 text-center text-sm font-semibold text-white"
//                                     : "block text-sm font-medium text-gray-800"
//                                 }`}
//                               >
//                                 {link.label}
//                               </LocalizedClientLink>
//                             ))}
//                           </div>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 ) : (
//                   <LocalizedClientLink
//                     href={link.href}
//                     onClick={onClose}
//                     className="block py-3 px-4 text-base font-medium hover:bg-gray-50 transition-colors"
//                   >
//                     {link.label}
//                   </LocalizedClientLink>
//                 )}
//               </li>
//             ))}

//             {/* Wishlist Link - No Icon */}
//             <li>
//               <LocalizedClientLink 
//                 href="/wishlist" 
//                 onClick={onClose}
//                 className="block py-3 px-4 text-base font-medium hover:bg-gray-50 transition-colors"
//               >
//                 Wishlist
//               </LocalizedClientLink>
//             </li>
//           </ul>
//         </nav>

//         {/* Login Button */}
//         <div className="px-4 pb-4">
//           <LocalizedClientLink href="/account" onClick={onClose}>
//             <button className="w-full py-3 px-4 bg-primary text-white rounded-lg font-medium hover:bg-opacity-90 transition-all">
//               Login / Sign Up
//             </button>
//           </LocalizedClientLink>
//         </div>
//       </div>
//     </>
//   )
// }

// export default MobileMenu


"use client"

import { useState, useEffect } from "react"
import { XMarkIcon, ArrowLeftIcon } from "@heroicons/react/24/outline"
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
  shopMenuPromo,
}: MobileMenuProps) => {
  const [menuStack, setMenuStack] = useState<MenuView[]>([])

  useBodyScrollLock({ isLocked: isOpen })

  // Initialize menu stack when opened
  useEffect(() => {
    if (isOpen && menuStack.length === 0) {
      setMenuStack([{ type: "main", title: "Menu" }])
    }
    // Reset when closed
    if (!isOpen) {
      setMenuStack([])
    }
  }, [isOpen])

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
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
        onClick={closeAll}
      />

      {/* Drawer Container - Multiple drawers can exist */}
      <div className="fixed inset-0 z-50 pointer-events-none">
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
              {navLinks.map((link) => (
                <li key={link.id} className="border-b border-gray-100">
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
                      className={
                        link.id === "club"
                          ? "flex items-center gap-2 mx-4 my-2 px-4 py-3 rounded-xl bg-violet-50 text-violet-700 font-bold border border-violet-100 shadow-sm"
                          : "block py-4 px-6 text-base font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                      }
                    >
                      {link.id === "club" && (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-violet-500">
                          <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM9 15a.75.75 0 01.721.544l.195.682a2.25 2.25 0 001.548 1.548l.682.195a.75.75 0 010 1.442l-.682.195a2.25 2.25 0 00-1.548 1.548l-.195.682a.75.75 0 01-1.442 0l-.195-.682a2.25 2.25 0 00-1.548-1.548l-.682-.195a.75.75 0 010-1.442l.682-.195a2.25 2.25 0 001.548-1.548l.195-.682A.75.75 0 019 15z" clipRule="evenodd" />
                        </svg>
                      )}
                      {link.label}
                    </LocalizedClientLink>
                  )}
                </li>
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
