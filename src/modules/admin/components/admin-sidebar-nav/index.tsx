"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  HomeIcon,
  TagIcon,
  ShoppingBagIcon,
  UsersIcon,
  RectangleStackIcon,
  FolderIcon,
  ArchiveBoxIcon,
  CreditCardIcon,
  TruckIcon,
  SparklesIcon,
  StarIcon,
  ReceiptPercentIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline"

const NAV_ITEMS = [
  { label: "Home", href: "/admin", icon: HomeIcon },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBagIcon },
  { label: "Products", href: "/admin/products", icon: TagIcon },
  { label: "Inventory", href: "/admin/inventory", icon: ArchiveBoxIcon },
  { label: "Collections", href: "/admin/collections", icon: RectangleStackIcon },
  { label: "Categories", href: "/admin/categories", icon: FolderIcon },
  { label: "Shipping", href: "/admin/shipping", icon: TruckIcon },
  { label: "Shipping Partners", href: "/admin/shipping-partners", icon: TruckIcon },
  { label: "Payments", href: "/admin/payments", icon: CreditCardIcon },
  { label: "Customers", href: "/admin/customers", icon: UsersIcon },
  { label: "Club", href: "/admin/club", icon: SparklesIcon },
  { label: "Reviews", href: "/admin/reviews", icon: StarIcon },
  { label: "Team", href: "/admin/team", icon: UsersIcon },
  { label: "Discounts", href: "/admin/discounts", icon: ReceiptPercentIcon },
  { label: "Home Settings", href: "/admin/home-settings", icon: PhotoIcon },
]

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin"
  }
  // Ensure we match either the exact path or a subpath (e.g. /admin/orders matches /admin/orders/123)
  // But strictly avoid matching /admin/shipping for /admin/shipping-partners
  return pathname === href || pathname.startsWith(`${href}/`)
}

type NavItemProps = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  pathname: string
  onClick?: () => void
}

function NavItem({ label, href, icon: Icon, pathname, onClick }: NavItemProps) {
  const active = isActive(pathname, href)

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${active
        ? "bg-gray-900 text-white shadow-sm"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
    >
      <Icon
        className={`h-5 w-5 shrink-0 transition-colors ${active ? "text-white" : "text-gray-400 group-hover:text-gray-600"
          }`}
      />
      <span className="flex-1">{label}</span>
    </Link>
  )
}

export function AdminSidebarNav({ onItemClick }: { onItemClick?: () => void } = {}) {
  const pathname = usePathname()

  return (
    <div className="space-y-6">
      <div>
        <p className="px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Store
        </p>
        <div className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.href}
              label={item.label}
              href={item.href}
              icon={item.icon}
              pathname={pathname}
              onClick={onItemClick}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
