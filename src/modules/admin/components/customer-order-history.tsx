"use client"

import { useState } from "react"
import Link from "next/link"
import { ShoppingBagIcon } from "@heroicons/react/24/outline"
import { convertToLocale } from "@lib/util/money"
import AdminBadge from "@modules/admin/components/admin-badge"
import { formatIST } from "@/lib/util/date"
import { getPaginatedCustomerOrders } from "@/lib/data/admin"
import { cn } from "@lib/util/cn"

interface CustomerOrderHistoryProps {
    userId: string
    initialOrders: any[]
    totalOrders: number
}

export default function CustomerOrderHistory({ userId, initialOrders, totalOrders }: CustomerOrderHistoryProps) {
    const [orders, setOrders] = useState(initialOrders)
    const [currentPage, setCurrentPage] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [total, setTotal] = useState(totalOrders)
    const limit = 5
    const totalPages = Math.ceil(total / limit)

    const handlePageChange = async (newPage: number) => {
        if (newPage < 1 || newPage > totalPages || newPage === currentPage) return

        setIsLoading(true)
        try {
            const result = await getPaginatedCustomerOrders(userId, newPage, limit)
            setOrders(result.data)
            setTotal(result.total)
            setCurrentPage(newPage)
        } catch (error) {
            console.error("Failed to fetch orders:", error)
        } finally {
            setIsLoading(false)
        }
    }

    if (total === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                <ShoppingBagIcon className="w-12 h-12 text-gray-200 mb-3" />
                <p className="font-medium">No orders yet</p>
                <p className="text-sm">This customer hasn&apos;t placed any orders.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                        </tr>
                    </thead>
                    <tbody className={cn("divide-y divide-gray-100 bg-white transition-opacity", isLoading && "opacity-50")}>
                        {orders.map((order: any) => (
                            <tr key={order.id} className="hover:bg-gray-50/80 transition-colors cursor-pointer group">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 group-hover:text-blue-600">
                                    <Link href={`/admin/orders/${order.id}`}>#{order.display_id}</Link>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatIST(order.created_at)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <AdminBadge variant={getStatusVariant(order.status)}>{order.status}</AdminBadge>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                                    {convertToLocale({ amount: order.total_amount, currency_code: order.currency_code })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100 bg-gray-50/30">
                    <div className="text-xs text-gray-500">
                        Showing <span className="font-medium text-gray-900">{(currentPage - 1) * limit + 1}</span> to{" "}
                        <span className="font-medium text-gray-900">{Math.min(currentPage * limit, total)}</span> of{" "}
                        <span className="font-medium text-gray-900">{total}</span> orders
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1 || isLoading}
                            className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <div className="flex items-center gap-1">
                            {(() => {
                                const pages: (number | string)[] = []
                                const delta = 1 // Number of pages either side of current

                                for (let i = 1; i <= totalPages; i++) {
                                    if (
                                        i === 1 ||
                                        i === totalPages ||
                                        (i >= currentPage - delta && i <= currentPage + delta)
                                    ) {
                                        pages.push(i)
                                    } else if (
                                        i === currentPage - delta - 1 ||
                                        i === currentPage + delta + 1
                                    ) {
                                        pages.push('...')
                                    }
                                }

                                const filteredPages = pages.filter((page, index) =>
                                    page !== '...' || pages[index - 1] !== '...'
                                )

                                return filteredPages.map((pageNum, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => typeof pageNum === 'number' && handlePageChange(pageNum)}
                                        disabled={isLoading || pageNum === '...'}
                                        className={cn(
                                            "w-8 h-8 text-xs font-medium rounded-md transition-colors",
                                            currentPage === pageNum
                                                ? "bg-gray-900 text-white"
                                                : pageNum === '...'
                                                    ? "text-gray-400 cursor-default"
                                                    : "text-gray-600 hover:bg-gray-50"
                                        )}
                                    >
                                        {pageNum}
                                    </button>
                                ))
                            })()}
                        </div>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages || isLoading}
                            className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

function getStatusVariant(status: string) {
    switch (status) {
        case 'paid': return 'success'
        case 'pending': return 'warning'
        case 'failed': return 'error'
        case 'cancelled': return 'neutral'
        default: return 'neutral'
    }
}
