"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { AgeCategory } from "@modules/layout/config/navigation"

interface DropdownProps {
  isOpen: boolean
  items: AgeCategory[]
  activePathname: string
  onItemClick: () => void
}

const ShopByAgeDropdown = ({ isOpen, items, activePathname, onItemClick }: DropdownProps) => {
  const isActive = (href: string) => activePathname.startsWith(href)

  return (
    <div
      className={`absolute top-10 left-0 mt-0.5 bg-white shadow-lg rounded-lg overflow-hidden transform transition-all duration-300 ease-out origin-top z-40 ${
        isOpen
          ? "opacity-100 scale-y-100 visible"
          : "opacity-0 scale-y-95 invisible"
      }`}
      style={{
        transformOrigin: "top left",
      }}
    >
      <div className="w-60 py-2">
        {items.map((category) => (
          <LocalizedClientLink
            key={category.id}
            href={category.href}
            onClick={onItemClick}
            className={`block px-6 py-3 text-sm font-medium transition-colors ${
              isActive(category.href)
                ? "bg-primary text-white"
                : "text-gray-700 hover:bg-gray-50 hover:text-primary"
            }`}
          >
            {category.label}
          </LocalizedClientLink>
        ))}
      </div>
    </div>
  )
}

export default ShopByAgeDropdown
