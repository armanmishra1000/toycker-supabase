import React from "react"
import Link from "next/link"
import { 
  HomeIcon, 
  TagIcon, 
  ShoppingBagIcon, 
  UsersIcon, 
  ArrowLeftOnRectangleIcon,
  RectangleStackIcon,
  ArrowTopRightOnSquareIcon,
  FolderIcon,
  Cog6ToothIcon,
  ArchiveBoxIcon,
  MagnifyingGlassIcon,
  CreditCardIcon,
  TruckIcon
} from "@heroicons/react/24/outline"
import { signout } from "@lib/data/customer"
import { ensureAdmin } from "@/lib/data/admin"

export const metadata = {
  title: "Toycker Admin",
  description: "Store Management",
}

const NAV_ITEMS = [
  { label: "Home", href: "/admin", icon: HomeIcon },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBagIcon },
  { label: "Products", href: "/admin/products", icon: TagIcon },
  { label: "Inventory", href: "/admin/inventory", icon: ArchiveBoxIcon },
  { label: "Collections", href: "/admin/collections", icon: RectangleStackIcon },
  { label: "Categories", href: "/admin/categories", icon: FolderIcon },
  { label: "Shipping", href: "/admin/shipping", icon: TruckIcon },
  { label: "Payments", href: "/admin/payments", icon: CreditCardIcon },
  { label: "Customers", href: "/admin/customers", icon: UsersIcon },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await ensureAdmin()

  return (
    <div className="min-h-screen bg-[#f6f6f7] flex font-sans text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1a1c1d] flex flex-col fixed inset-y-0 z-50">
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <span className="font-bold text-xl text-white tracking-tighter uppercase italic">Toycker</span>
          <span className="ml-2 px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-bold text-white/60">ADMIN</span>
        </div>
        
        <nav className="flex-1 px-3 py-6 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all text-gray-400 hover:bg-white/5 hover:text-white"
            >
              <item.icon className="mr-3 h-5 w-5 transition-colors" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
          <Link
            href="/admin/settings"
            className="group flex items-center px-3 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            <Cog6ToothIcon className="mr-3 h-5 w-5" />
            Settings
          </Link>
          <Link
            href="/"
            target="_blank"
            className="group flex items-center px-3 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            <ArrowTopRightOnSquareIcon className="mr-3 h-5 w-5" />
            View Store
          </Link>
          <form action={signout}>
            <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-400 hover:text-rose-400 transition-all">
              <ArrowLeftOnRectangleIcon className="mr-3 h-5 w-5" />
              Log out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-40 flex items-center justify-between px-8">
           <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="search" 
                placeholder="Search products, orders..." 
                className="w-full bg-gray-100 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-black transition-all"
              />
           </div>
           <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                 <UsersIcon className="h-4 w-4 text-gray-500" />
              </div>
           </div>
        </header>

        <div className="p-8 max-w-6xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  )
}