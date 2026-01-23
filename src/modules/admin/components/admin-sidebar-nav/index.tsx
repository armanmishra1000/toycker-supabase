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
import { useHasPermission } from "@/lib/permissions/context"
import { PERMISSIONS, Permission } from "@/lib/permissions"

type NavItemConfig = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  permission?: Permission // Optional - if not specified, always show
}

const NAV_ITEMS: NavItemConfig[] = [
  { label: "Home", href: "/admin", icon: HomeIcon }, // Always visible
  { label: "Orders", href: "/admin/orders", icon: ShoppingBagIcon, permission: PERMISSIONS.ORDERS_READ },
  { label: "Products", href: "/admin/products", icon: TagIcon, permission: PERMISSIONS.PRODUCTS_READ },
  { label: "Inventory", href: "/admin/inventory", icon: ArchiveBoxIcon, permission: PERMISSIONS.INVENTORY_READ },
  { label: "Collections", href: "/admin/collections", icon: RectangleStackIcon, permission: PERMISSIONS.COLLECTIONS_READ },
  { label: "Categories", href: "/admin/categories", icon: FolderIcon, permission: PERMISSIONS.CATEGORIES_READ },
  { label: "Shipping", href: "/admin/shipping", icon: TruckIcon, permission: PERMISSIONS.SHIPPING_READ },
  { label: "Shipping Partners", href: "/admin/shipping-partners", icon: TruckIcon, permission: PERMISSIONS.SHIPPING_PARTNERS_READ },
  { label: "Payments", href: "/admin/payments", icon: CreditCardIcon, permission: PERMISSIONS.PAYMENTS_READ },
  { label: "Customers", href: "/admin/customers", icon: UsersIcon, permission: PERMISSIONS.CUSTOMERS_READ },
  { label: "Club", href: "/admin/club", icon: SparklesIcon, permission: PERMISSIONS.CLUB_SETTINGS_READ },
  { label: "Reviews", href: "/admin/reviews", icon: StarIcon, permission: PERMISSIONS.REVIEWS_READ },
  { label: "Team", href: "/admin/team", icon: UsersIcon, permission: PERMISSIONS.TEAM_MANAGE },
  { label: "Discounts", href: "/admin/discounts", icon: ReceiptPercentIcon, permission: PERMISSIONS.DISCOUNTS_READ },
  { label: "Home Settings", href: "/admin/home-settings", icon: PhotoIcon, permission: PERMISSIONS.HOME_SETTINGS_READ },
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

/**
 * Wrapper component that conditionally renders NavItem based on permission
 */
function ProtectedNavItem({
  item,
  pathname,
  onClick,
}: {
  item: NavItemConfig
  pathname: string
  onClick?: () => void
}) {
  const hasPermission = useHasPermission(item.permission || ('*' as Permission))

  // If permission is required and user doesn't have it, don't render
  if (item.permission && !hasPermission) {
    return null
  }

  return (
    <NavItem
      label={item.label}
      href={item.href}
      icon={item.icon}
      pathname={pathname}
      onClick={onClick}
    />
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
            <ProtectedNavItem
              key={item.href}
              item={item}
              pathname={pathname}
              onClick={onItemClick}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
