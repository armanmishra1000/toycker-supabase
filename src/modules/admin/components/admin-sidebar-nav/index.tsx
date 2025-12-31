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
]

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin"
  }
  return pathname.startsWith(href)
}

type NavItemProps = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  pathname: string
}

function NavItem({ label, href, icon: Icon, pathname }: NavItemProps) {
  const active = isActive(pathname, href)

  return (
    <Link
      href={href}
      className={`group flex items-center px-3 py-2 text-[14px] font-medium rounded-lg transition-all ${
        active
          ? "bg-white/[0.12] text-white"
          : "text-[#a6acb2] hover:bg-white/[0.08] hover:text-gray-100"
      } active:scale-[0.98] active:opacity-90`}
    >
      <Icon
        className={`mr-3 h-5 w-5 transition-colors ${
          active ? "text-white" : "text-[#8c9196] group-hover:text-gray-100"
        }`}
      />
      {label}
    </Link>
  )
}

export function AdminSidebarNav() {
  const pathname = usePathname()

  return (
    <>
      <p className="px-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 mt-2">
        Store Management
      </p>
      {NAV_ITEMS.map((item) => (
        <NavItem
          key={item.href}
          label={item.label}
          href={item.href}
          icon={item.icon}
          pathname={pathname}
        />
      ))}

      <p className="px-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 mt-6">
        Sales Channels
      </p>
    </>
  )
}
