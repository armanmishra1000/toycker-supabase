"use client"

import { ProtectedAction } from "@/lib/permissions/components/protected-action"
import { PERMISSIONS } from "@/lib/permissions"
import Link from "next/link"
import { PlusIcon } from "@heroicons/react/24/outline"

export function CreateCategoryButton() {
    return (
        <ProtectedAction permission={PERMISSIONS.CATEGORIES_CREATE} hideWhenDisabled>
            <Link
                href="/admin/categories/new"
                className="inline-flex items-center px-4 py-2 bg-gray-900 border border-transparent rounded-lg font-medium text-xs text-white hover:bg-black transition-colors shadow-sm"
            >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add category
            </Link>
        </ProtectedAction>
    )
}
