"use client"

import { deleteProduct } from "@/lib/data/admin"
import { TrashIcon } from "@heroicons/react/24/outline"
import { useState, useTransition } from "react"
import { cn } from "@lib/util/cn"
import { Loader2 } from "lucide-react"

type DeleteProductButtonProps = {
  productId: string
  productName: string
  redirectTo?: string
  variant?: "icon" | "button"
  className?: string
}

export default function DeleteProductButton({
  productId,
  productName,
  redirectTo,
  variant = "button",
  className
}: DeleteProductButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      startTransition(async () => {
        try {
          await deleteProduct(productId, redirectTo)
        } catch (error) {
          console.error("Failed to delete product:", error)
          alert("Failed to delete product. Please try again.")
        }
      })
    }
  }

  if (variant === "icon") {
    return (
      <button
        onClick={handleDelete}
        disabled={isPending}
        className={cn(
          "p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 disabled:opacity-50",
          className
        )}
        title="Delete Product"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        ) : (
          <TrashIcon className="h-4 w-4" />
        )}
      </button>
    )
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50",
        className
      )}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <TrashIcon className="h-4 w-4" />
      )}
      {isPending ? "Deleting..." : "Delete Product"}
    </button>
  )
}
