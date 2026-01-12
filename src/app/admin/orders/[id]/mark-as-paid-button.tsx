"use client"

import { useTransition } from "react"
import { updateOrderStatus } from "@/lib/data/admin"
import { cn } from "@lib/util/cn"

export function MarkAsPaidButton({ orderId }: { orderId: string }) {
    const [isPending, startTransition] = useTransition()

    return (
        <button
            onClick={() => {
                startTransition(async () => {
                    await updateOrderStatus(orderId, 'paid')
                })
            }}
            disabled={isPending}
            className={cn(
                "px-4 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 min-w-[120px]",
                isPending && "cursor-not-allowed"
            )}
        >
            {isPending && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {isPending ? "Updating..." : "Mark as Paid"}
        </button>
    )
}
