"use client"

import { useState } from "react"
import Link from "next/link"
import { StarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from "@heroicons/react/24/outline"
import { formatIST } from "@/lib/util/date"
import { getPaginatedCustomerRewardTransactions } from "@/lib/data/admin"
import { cn } from "@lib/util/cn"

interface CustomerRewardHistoryProps {
    userId: string
    initialTransactions: any[]
    totalTransactions: number
}

export default function CustomerRewardHistory({ userId, initialTransactions, totalTransactions }: CustomerRewardHistoryProps) {
    const [transactions, setTransactions] = useState(initialTransactions)
    const [currentPage, setCurrentPage] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [total, setTotal] = useState(totalTransactions)
    const limit = 5
    const totalPages = Math.ceil(total / limit)

    const handlePageChange = async (newPage: number) => {
        if (newPage < 1 || newPage > totalPages || newPage === currentPage) return

        setIsLoading(true)
        try {
            const result = await getPaginatedCustomerRewardTransactions(userId, newPage, limit)
            setTransactions(result.data)
            setTotal(result.total)
            setCurrentPage(newPage)
        } catch (error) {
            console.error("Failed to fetch transactions:", error)
        } finally {
            setIsLoading(false)
        }
    }

    if (total === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                <StarIcon className="w-12 h-12 text-gray-200 mb-3" />
                <p className="font-medium">No transactions yet</p>
                <p className="text-sm">This customer hasn&apos;t earned or spent any rewards.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                        </tr>
                    </thead>
                    <tbody className={cn("divide-y divide-gray-100 bg-white transition-opacity", isLoading && "opacity-50")}>
                        {transactions.map((tx: any) => (
                            <tr key={tx.id} className="hover:bg-gray-50/80 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        {tx.type === 'earned' ? (
                                            <div className="p-1 rounded bg-emerald-50 text-emerald-600">
                                                <ArrowTrendingUpIcon className="w-3.5 h-3.5" />
                                            </div>
                                        ) : (
                                            <div className="p-1 rounded bg-red-50 text-red-600">
                                                <ArrowTrendingDownIcon className="w-3.5 h-3.5" />
                                            </div>
                                        )}
                                        <span className={cn(
                                            "text-xs font-bold uppercase",
                                            tx.type === 'earned' ? "text-emerald-700" : "text-red-700"
                                        )}>
                                            {tx.type}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatIST(tx.created_at)}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-700">
                                    {tx.description}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    {tx.orders ? (
                                        <Link href={`/admin/orders/${tx.order_id}`} className="text-blue-600 hover:underline">
                                            #{tx.orders.display_id}
                                        </Link>
                                    ) : (
                                        <span className="text-gray-400">---</span>
                                    )}
                                </td>
                                <td className={cn(
                                    "px-6 py-4 whitespace-nowrap text-sm font-bold text-right",
                                    tx.amount > 0 ? "text-emerald-600" : "text-red-600"
                                )}>
                                    {tx.amount > 0 ? '+' : ''}{tx.amount}
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
                        <span className="font-medium text-gray-900">{total}</span> transactions
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
                                const delta = 1

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
