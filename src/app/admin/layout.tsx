import React from "react"
import Link from "next/link"
import { 
  HomeIcon, 
  TagIcon, 
  ShoppingBagIcon, 
  UsersIcon, 
  ArrowLeftOnRectangleIcon,
  ShoppingBagIcon as LogoIcon,
  RectangleStackIcon
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
  { label: "Collections", href: "/admin/collections", icon: RectangleStackIcon },
  { label: "Customers", href: "/admin/customers", icon: UsersIcon },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await ensureAdmin()

  return (
    <div className="min-h-screen bg-[#f6f6f7] flex font-sans text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-[#ebebeb] border-r border-gray-200 flex flex-col fixed inset-y-0 z-50">
        <div className="h-14 flex items-center px-6 border-b border-gray-200 bg-white">
          <LogoIcon className="h-6 w-6 text-gray-900 mr-2" />
          <span className="font-bold text-lg text-gray-900 tracking-tight">Toycker</span>
        </div>
        
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-white transition-all text-gray-600 hover:text-gray-900"
            >
              <item.icon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <form action={signout}>
            <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 rounded-lg hover:bg-white transition-all">
              <ArrowLeftOnRectangleIcon className="mr-3 h-5 w-5" />
              Log out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen">
        {/* Top Navbar */}
        <header className="h-14 bg-white border-b border-gray-200 sticky top-0 z-40 flex items-center justify-end px-8">
           <div className="text-sm font-medium text-gray-500">Admin Account</div>
        </header>

        <div className="p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}