"use client"

import { ProtectedAction } from "@/lib/permissions/components/protected-action"
import { PERMISSIONS } from "@/lib/permissions"
import { TrashIcon } from "@heroicons/react/24/outline"

interface DeleteProductButtonProps {
    productId: string
    deleteAction: (_id: string, _redirectTo?: string) => Promise<void>
}

export function DeleteProductButton({ productId, deleteAction }: DeleteProductButtonProps) {
    return (
        <ProtectedAction permission={PERMISSIONS.PRODUCTS_DELETE} hideWhenDisabled>
            <form action={deleteAction.bind(null, productId, "/admin/products")}>
                <button
                    type="submit"
                    className="p-1.5 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                >
                    <TrashIcon className="h-4 w-4" />
                </button>
            </form>
        </ProtectedAction>
    )
}
