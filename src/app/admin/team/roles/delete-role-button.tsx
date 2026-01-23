"use client"

import { useFormStatus } from "react-dom"
import { TrashIcon } from "@heroicons/react/24/outline"
import { Loader2 } from "lucide-react"
import { ProtectedAction } from "@/lib/permissions/components/protected-action"
import { PERMISSIONS } from "@/lib/permissions"

function DeleteButton() {
    const { pending } = useFormStatus()

    return (
        <button
            type="submit"
            disabled={pending}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete role"
        >
            {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <TrashIcon className="h-4 w-4" />
            )}
        </button>
    )
}

interface DeleteRoleButtonProps {
    roleId: string
    deleteAction: (_roleId: string) => Promise<void>
}

export function DeleteRoleButton({ roleId, deleteAction }: DeleteRoleButtonProps) {
    return (
        <ProtectedAction permission={PERMISSIONS.TEAM_MANAGE} hideWhenDisabled>
            <form action={deleteAction.bind(null, roleId)}>
                <DeleteButton />
            </form>
        </ProtectedAction>
    )
}
