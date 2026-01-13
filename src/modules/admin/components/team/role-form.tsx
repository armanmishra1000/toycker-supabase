"use client"

import { useTransition } from "react"
import AdminCard from "@modules/admin/components/admin-card"
import { ActionButton } from "@/modules/admin/components"
import Link from "next/link"
import { getPermissionLabel } from "@/lib/permissions"
import { AdminRole } from "@/lib/supabase/types"

interface RoleFormProps {
    initialData?: AdminRole
    onSubmit: (_formData: FormData) => Promise<void>
}

export default function RoleForm({ initialData, onSubmit }: RoleFormProps) {
    const [isPending, startTransition] = useTransition()

    const permissionGroups = {
        Orders: ["orders:read", "orders:update", "orders:delete"],
        Products: ["products:read", "products:create", "products:update", "products:delete"],
        Inventory: ["inventory:read", "inventory:update"],
        Customers: ["customers:read", "customers:update"],
        Team: ["team:manage"],
        Settings: ["settings:read", "settings:update"],
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const form = e.currentTarget
        const formData = new FormData(form)

        // Collect checked permissions
        const checkboxes = form.querySelectorAll<HTMLInputElement>(
            'input[type="checkbox"]:checked'
        )
        const permissions = Array.from(checkboxes).map((cb) => cb.value)
        formData.set("permissions", JSON.stringify(permissions))

        startTransition(async () => {
            await onSubmit(formData)
        })
    }

    return (
        <AdminCard>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Role Name
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        defaultValue={initialData?.name}
                        placeholder="e.g., Order Manager"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Permissions
                    </label>
                    <div className="space-y-4">
                        {Object.entries(permissionGroups).map(([group, permissions]) => (
                            <div key={group} className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                                    {group}
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    {permissions.map((perm) => (
                                        <label
                                            key={perm}
                                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:border-indigo-300 cursor-pointer transition-colors has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50"
                                        >
                                            <input
                                                type="checkbox"
                                                name={`perm_${perm}`}
                                                value={perm}
                                                defaultChecked={initialData?.permissions.includes(perm)}
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-xs font-medium text-gray-700">
                                                {getPermissionLabel(perm)}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                    <Link
                        href="/admin/team/roles"
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                    >
                        Cancel
                    </Link>
                    <ActionButton
                        type="submit"
                        variant="primary"
                        isLoading={isPending}
                        loadingText="Saving..."
                        className="bg-black hover:bg-gray-800"
                    >
                        {initialData ? "Update Role" : "Create Role"}
                    </ActionButton>
                </div>
            </form>
        </AdminCard>
    )
}
