"use client"

import React, { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Dialog, Combobox, Transition } from "@headlessui/react"
import {
    MagnifyingGlassIcon,
    ShoppingBagIcon,
    ReceiptPercentIcon,
    UsersIcon,
    RectangleStackIcon,
    TagIcon,
    XMarkIcon,
    PlusIcon,
    ChartBarIcon,
    AdjustmentsHorizontalIcon,
    ArrowRightIcon
} from "@heroicons/react/24/outline"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getAdminGlobalSearch, AdminSearchResult } from "@/lib/data/admin"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

const typeIcons = {
    product: ShoppingBagIcon,
    order: ReceiptPercentIcon,
    customer: UsersIcon,
    collection: RectangleStackIcon,
    category: TagIcon,
}

const quickActions = [
    { id: "add-product", title: "Add New Product", subtitle: "Create a new product listing", url: "/admin/products/new", icon: PlusIcon, color: "text-emerald-500", bg: "bg-emerald-50" },
    { id: "view-orders", title: "View All Orders", subtitle: "Manage your store sales", url: "/admin/orders", icon: ReceiptPercentIcon, color: "text-blue-500", bg: "bg-blue-50" },
    { id: "dashboard", title: "Analytics Dashboard", subtitle: "View store performance", url: "/admin", icon: ChartBarIcon, color: "text-purple-500", bg: "bg-purple-50" },
    { id: "settings", title: "Store Settings", subtitle: "Configurations and roles", url: "/admin/settings", icon: AdjustmentsHorizontalIcon, color: "text-gray-500", bg: "bg-gray-50" },
]

export function AdminGlobalSearch() {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<AdminSearchResult[]>([])
    const [isPending, startTransition] = useTransition()

    // Handle Hotkeys
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault()
                setIsOpen(true)
            }
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [])

    // Handle Search Fetching with Debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim().length >= 2) {
                startTransition(async () => {
                    try {
                        const data = await getAdminGlobalSearch(query)
                        setResults(data || [])
                    } catch (error) {
                        console.error("Global search error:", error)
                        setResults([])
                    }
                })
            } else {
                setResults([])
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [query])

    const handleSelect = (url: string | null | undefined) => {
        if (!url) return
        setIsOpen(false)
        router.push(url)
        setQuery("")
    }

    // Group results by type
    // Group results by type
    const groupedResults = (() => {
        const groups: Record<string, AdminSearchResult[]> = {}
        results.forEach(result => {
            if (!groups[result.type]) groups[result.type] = []
            groups[result.type].push(result)
        })
        return groups
    })()

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="w-full h-11 pl-11 pr-4 text-sm bg-gray-100/80 border border-transparent rounded-xl hover:bg-gray-200/80 hover:border-gray-300/50 transition-all text-left flex items-center text-gray-500 group relative backdrop-blur-sm"
            >
                <MagnifyingGlassIcon className="absolute left-4 h-5 w-5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                <span className="truncate font-medium">Search anything...</span>
                <div className="hidden sm:flex absolute right-4 gap-1 items-center">
                    <kbd className="px-2 py-0.5 text-[10px] font-bold text-gray-500 bg-white border border-gray-200 rounded-md shadow-sm">
                        ⌘
                    </kbd>
                    <kbd className="px-2 py-0.5 text-[10px] font-bold text-gray-500 bg-white border border-gray-200 rounded-md shadow-sm">
                        K
                    </kbd>
                </div>
            </button>

            <Transition.Root show={isOpen} as={React.Fragment} afterLeave={() => setQuery("")} appear>
                <Dialog as="div" className="relative z-[100]" onClose={setIsOpen}>
                    <Transition.Child
                        as={React.Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-sm transition-opacity" />
                    </Transition.Child>

                    <div className="fixed inset-0 z-10 overflow-y-auto p-4 sm:p-6 md:p-20">
                        <Transition.Child
                            as={React.Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95 translate-y-4"
                            enterTo="opacity-100 scale-100 translate-y-0"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100 translate-y-0"
                            leaveTo="opacity-0 scale-95 translate-y-4"
                        >
                            <Dialog.Panel className="mx-auto max-w-3xl transform overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 transition-all outline-none font-inter">
                                <Combobox value={null as any} onChange={handleSelect}>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none">
                                            <MagnifyingGlassIcon className={cn("h-6 w-6 transition-colors duration-200", isPending ? "text-emerald-500" : "text-gray-400 group-focus-within:text-emerald-500")} />
                                        </div>
                                        <Combobox.Input
                                            className="h-16 w-full border-0 bg-transparent pl-14 pr-16 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-lg font-medium outline-none"
                                            placeholder="Search products, orders, customers..."
                                            value={query}
                                            onChange={(event) => setQuery(event.target.value)}
                                            autoFocus
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                                            {isPending ? (
                                                <div className="h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                                                    <XMarkIcon className="h-6 w-6 text-gray-400" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="max-h-[60vh] overflow-y-auto scrollbar-hide">
                                        {query === "" && (
                                            <div className="p-4">
                                                <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-3">Quick Actions</h2>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {quickActions.map((action) => (
                                                        <Combobox.Option
                                                            key={action.id}
                                                            value={action.url}
                                                            className="block"
                                                        >
                                                            {({ active }) => (
                                                                <LocalizedClientLink
                                                                    href={action.url}
                                                                    onClick={() => setIsOpen(false)}
                                                                    className={cn(
                                                                        "flex items-center gap-4 p-3 rounded-xl transition-all cursor-pointer border border-transparent",
                                                                        active ? "bg-emerald-50 border-emerald-100" : "hover:bg-gray-50"
                                                                    )}
                                                                >
                                                                    <div className={cn("h-10 w-10 shrink-0 flex items-center justify-center rounded-xl", action.bg, action.color)}>
                                                                        <action.icon className="h-6 w-6" />
                                                                    </div>
                                                                    <div className="flex-1 overflow-hidden text-left">
                                                                        <div className="font-semibold text-gray-900 text-sm truncate">{action.title}</div>
                                                                        <div className="text-xs text-gray-500 truncate">{action.subtitle}</div>
                                                                    </div>
                                                                    <ArrowRightIcon className="h-4 w-4 text-gray-300" />
                                                                </LocalizedClientLink>
                                                            )}
                                                        </Combobox.Option>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {results.length > 0 ? (
                                            <div className="py-2">
                                                {Object.entries(groupedResults).map(([type, items]) => (
                                                    <div key={type} className="px-2">
                                                        <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-3 mt-1 flex items-center justify-between">
                                                            <span>{type}s</span>
                                                            <span className="h-4 px-1.5 bg-gray-100 rounded flex items-center font-mono">{items.length}</span>
                                                        </h2>
                                                        <div className="space-y-1">
                                                            {items.map((result) => (
                                                                <Combobox.Option
                                                                    key={`${result.type}-${result.id}`}
                                                                    value={result.url}
                                                                    className="block"
                                                                >
                                                                    {({ active }) => {
                                                                        const Icon = typeIcons[result.type]
                                                                        return (
                                                                            <LocalizedClientLink
                                                                                href={result.url}
                                                                                onClick={() => setIsOpen(false)}
                                                                                className={cn(
                                                                                    "group flex items-center gap-4 px-4 py-3 rounded-xl transition-all cursor-pointer relative",
                                                                                    active ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 translate-x-1" : "hover:bg-gray-50"
                                                                                )}
                                                                            >
                                                                                <div className={cn(
                                                                                    "h-11 w-11 shrink-0 flex items-center justify-center rounded-xl transition-colors overflow-hidden border border-transparent shadow-sm",
                                                                                    active ? "bg-white/20 border-white/30" : "bg-gray-100 border-gray-200"
                                                                                )}>
                                                                                    {result.thumbnail ? (
                                                                                        <img src={result.thumbnail} alt={result.title} className="h-full w-full object-cover" />
                                                                                    ) : (
                                                                                        <Icon className={cn("h-6 w-6", active ? "text-white" : "text-gray-500")} />
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex-1 flex flex-col min-w-0 text-left">
                                                                                    <span className={cn("font-bold truncate tracking-tight", active ? "text-white" : "text-gray-900")}>
                                                                                        {result.title}
                                                                                    </span>
                                                                                    <span className={cn("text-xs truncate font-medium", active ? "text-emerald-50/80" : "text-gray-500")}>
                                                                                        {result.subtitle}
                                                                                    </span>
                                                                                </div>
                                                                                <div className={cn(
                                                                                    "flex h-6 w-6 items-center justify-center rounded-lg transition-opacity",
                                                                                    active ? "opacity-100 bg-white/20" : "opacity-0"
                                                                                )}>
                                                                                    <ArrowRightIcon className="h-4 w-4" />
                                                                                </div>
                                                                            </LocalizedClientLink>
                                                                        )
                                                                    }}
                                                                </Combobox.Option>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            query !== "" && !isPending && (
                                                <div className="p-20 text-center">
                                                    <div className="mx-auto h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                                        <XMarkIcon className="h-10 w-10 text-gray-300" />
                                                    </div>
                                                    <h3 className="text-lg font-bold text-gray-900 mb-2">No results matched your search</h3>
                                                    <p className="text-gray-500 max-w-xs mx-auto text-sm">
                                                        We couldn&apos;t find anything for &quot;<span className="font-semibold text-gray-900">{query}</span>&quot;. Try a different keyword.
                                                    </p>
                                                </div>
                                            )
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between bg-gray-50/80 px-5 py-3 text-xs text-gray-500 font-semibold select-none backdrop-blur-sm">
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-2">
                                                <kbd className="flex items-center justify-center h-5 px-1 bg-white border border-gray-200 rounded text-[10px] shadow-sm">Enter</kbd>
                                                <span>to select</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <kbd className="flex items-center justify-center h-5 w-7 bg-white border border-gray-200 rounded text-[10px] shadow-sm">↑↓</kbd>
                                                <span>to navigate</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setIsOpen(false)}
                                            className="flex items-center gap-2 hover:bg-gray-200/50 px-2 py-1 -mx-2 -my-1 rounded-md transition-all active:scale-95 group"
                                        >
                                            <kbd className="flex items-center justify-center h-5 w-7 bg-white border border-gray-200 rounded text-[10px] shadow-sm group-hover:border-emerald-500 group-hover:text-emerald-500 transition-colors">Esc</kbd>
                                        </button>
                                    </div>
                                </Combobox>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition.Root>
        </>
    )
}
