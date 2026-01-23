"use client"

import { ProtectedAction } from "@/lib/permissions/components/protected-action"
import { PERMISSIONS } from "@/lib/permissions"
import { TrashIcon } from "@heroicons/react/24/outline"

interface DeleteCategoryButtonProps {
    categoryId: string
    deleteAction: (_id: string) => Promise<void>
}

export function DeleteCategoryButton({ categoryId, deleteAction }: DeleteCategoryButtonProps) {
    return (
        <ProtectedAction permission={PERMISSIONS.CATEGORIES_DELETE} hideWhenDisabled>
            <form action={deleteAction.bind(null, categoryId)}>
                <button className="p-1.5 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded transition-colors">
                    <TrashIcon className="h-4 w-4" />
                </button>
            </form>
        </ProtectedAction>
    )
}
