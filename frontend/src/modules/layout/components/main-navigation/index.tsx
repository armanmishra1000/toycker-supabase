"use client"

import { useEffect, useRef, useState } from "react"
import type { FocusEvent, KeyboardEvent as ReactKeyboardEvent } from "react"
import { usePathname } from "next/navigation"
import { ChevronDownIcon } from "@heroicons/react/24/outline"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ShopMegaMenu from "@modules/layout/components/shop-mega-menu"
import {
  NavLink,
  ShopMenuPromo,
  ShopMenuSection,
} from "@modules/layout/config/navigation"
import { useOnClickOutside } from "@modules/layout/hooks/useOnClickOutside"

type MainNavigationProps = {
  navLinks: NavLink[]
  shopMenuSections: ShopMenuSection[]
  shopMenuPromo: ShopMenuPromo
}

const MainNavigation = ({ navLinks, shopMenuSections, shopMenuPromo }: MainNavigationProps) => {
  const pathname = usePathname()
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null)
  const navRef = useRef<HTMLElement | null>(null)
  const shopWrapperRef = useRef<HTMLDivElement | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [shopMenuOffset, setShopMenuOffset] = useState(0)

  const cleanPathname = pathname.replace(/^\/[a-z]{2}(\/|$)/, "/")

  useOnClickOutside(navRef, () => setActiveDropdownId(null))

  useEffect(() => {
    setActiveDropdownId(null)
  }, [pathname])

  useEffect(() => {
    const updateOffset = () => {
      if (!navRef.current || !shopWrapperRef.current) return

      const navRect = navRef.current.getBoundingClientRect()
      const wrapperRect = shopWrapperRef.current.getBoundingClientRect()
      setShopMenuOffset(wrapperRect.left - navRect.left)
    }

    updateOffset()
    window.addEventListener("resize", updateOffset)
    return () => window.removeEventListener("resize", updateOffset)
  }, [navLinks])

  const isActive = (href: string) => {
    if (href === "/" && cleanPathname === "/") return true
    if (href !== "/" && cleanPathname.startsWith(href)) return true
    return false
  }

  const clearTimers = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    if (openTimer.current) {
      clearTimeout(openTimer.current)
      openTimer.current = null
    }
  }

  const openDropdown = (id: string) => {
    clearTimers()
    openTimer.current = setTimeout(() => {
      setActiveDropdownId(id)
    }, 80)
  }

  const scheduleClose = () => {
    clearTimers()
    closeTimer.current = setTimeout(() => {
      setActiveDropdownId(null)
    }, 150)
  }

  const handleTriggerKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    id: string,
    isOpen: boolean,
  ) => {
    if (event.key === "Escape") {
      setActiveDropdownId(null)
      return
    }

    if ((event.key === "Enter" || event.key === " ") && !isOpen) {
      event.preventDefault()
      openDropdown(id)
    }
  }

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      scheduleClose()
    }
  }

  const closeDropdown = () => setActiveDropdownId(null)

  return (
    <nav ref={navRef} className="flex items-center gap-8" aria-label="Main navigation">
      {navLinks.map((link) => {
        const active = isActive(link.href)

        if (link.hasDropdown) {
          const isOpen = activeDropdownId === link.id
          return (
            <div
              key={link.id}
              className="relative"
              ref={link.id === "shop" ? shopWrapperRef : undefined}
              onMouseEnter={() => openDropdown(link.id)}
              onMouseLeave={scheduleClose}
              onFocusCapture={() => openDropdown(link.id)}
              onBlurCapture={handleBlur}
            >
              <button
                onClick={() => (isOpen ? setActiveDropdownId(null) : openDropdown(link.id))}
                className={`flex items-center gap-1 font-medium transition-colors hover:text-primary py-4 ${
                  active ? "text-primary" : "text-black"
                }`}
                aria-expanded={isOpen}
                aria-haspopup="true"
                onKeyDown={(event) => handleTriggerKeyDown(event, link.id, isOpen)}
              >
                {link.label}
                <ChevronDownIcon
                  className={`w-4 h-4 transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              <ShopMegaMenu
                sections={shopMenuSections}
                promo={shopMenuPromo}
                isOpen={isOpen}
                offsetLeft={link.id === "shop" ? shopMenuOffset : 0}
                onMouseEnter={() => openDropdown(link.id)}
                onMouseLeave={scheduleClose}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setActiveDropdownId(null)
                  }
                }}
              />
            </div>
          )
        }

        return (
          <LocalizedClientLink
            key={link.id}
            href={link.href}
            className={`font-medium transition-colors hover:text-primary py-4 ${
              active ? "text-primary" : "text-black"
            }`}
            onClick={closeDropdown}
          >
            {link.label}
          </LocalizedClientLink>
        )
      })}
    </nav>
  )
}

export default MainNavigation
