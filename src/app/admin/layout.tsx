import React from "react"
import Link from "next/link"
import { 
  HomeIcon, 
  TagIcon, 
  ShoppingBagIcon, 
  UsersIcon, 
  ArrowLeftOnRectangleIcon 
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
  { label: "Customers", href: "/admin/customers", icon: UsersIcon },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Protect all admin routes
  await ensureAdmin()

  return (
    <div className="min-h-screen bg-[#f1f2f4] flex font-sans text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1a1a1a] text-[#e3e3e3] flex flex-col fixed inset-y-0 z-50 shadow-xl">
        <div className="h-16 flex items-center px-6 border-b border-[#333]">
          <span className="font-bold text-lg text-white tracking-tight">Toycker Admin</span>
        </div>
        
        <nav className="flex-1 px-3 py-6 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-[#333] hover:text-white transition-all"
            >
              <item.icon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-[#333]">
          <form action={signout}>
            <button className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-gray-400 hover:text-white rounded-lg hover:bg-[#333] transition-all">
              <ArrowLeftOnRectangleIcon className="mr-3 h-5 w-5" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen">
        <div className="p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}