"use client"

import { deletePromotion } from "@/lib/data/promotions"
import { TrashIcon } from "@heroicons/react/24/outline"
import { useTransition } from "react"
import { cn } from "@lib/util/cn"
import { Loader2 } from "lucide-react"

type DeletePromotionButtonProps = {
    promoId: string
    promoCode: string
    className?: string
}

export default function DeletePromotionButton({
    promoId,
    promoCode,
    className
}: DeletePromotionButtonProps) {
    const [isPending, startTransition] = useTransition()

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (window.confirm(`Are you sure you want to delete the discount "${promoCode}"? This action cannot be undone.`)) {
            startTransition(async () => {
                try {
                    await deletePromotion(promoId)
                } catch (error) {
                    console.error("Failed to delete promotion:", error)
                    alert("Failed to delete promotion. Please try again.")
                }
            })
        }
    }

    return (
        <button
            onClick={handleDelete}
            disabled={isPending}
            className={cn(
                "p-1.5 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50",
                className
            )}
            title="Delete Discount"
        >
            {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <TrashIcon className="h-4 w-4" />
            )}
        </button>
    )
}
