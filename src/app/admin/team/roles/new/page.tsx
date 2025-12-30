"use client"

import { createRole } from "@/lib/data/admin"
import { getPermissionLabel } from "@/lib/permissions"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import AdminCard from "@modules/admin/components/admin-card"
import Link from "next/link"
import { ChevronLeftIcon } from "@heroicons/react/24/outline"
import { useRef } from "react"

export default function NewRole() {
    const formRef = useRef<HTMLFormElement>(null)

    const permissionGroups = {
        Orders: ['orders:read', 'orders:update', 'orders:delete'],
        Products: ['products:read', 'products:create', 'products:update', 'products:delete'],
        Inventory: ['inventory:read', 'inventory:update'],
        Customers: ['customers:read', 'customers:update'],
        Team: ['team:manage'],
        Settings: ['settings:read', 'settings:update'],
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const form = formRef.current
        if (!form) return

        // Collect checked permissions
        const checkboxes = form.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked')
        const permissions = Array.from(checkboxes).map((cb) => cb.value)

        // Create FormData with permissions
        const formData = new FormData(form)
        formData.set('permissions', JSON.stringify(permissions))

        await createRole(formData)
    }

    return (
        <div className="max-w-2xl space-y-6">
            <nav className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                <Link href="/admin/team/roles" className="flex items-center hover:text-black transition-colors">
                    <ChevronLeftIcon className="h-3 w-3 mr-1" strokeWidth={3} />
                    Back to Roles
                </Link>
            </nav>

            <AdminPageHeader title="Create Role" />

            <AdminCard>
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Role Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            required
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
                                <div key={group} className="border border-gray-200 rounded-lg p-4">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                        {group}
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {permissions.map((perm) => (
                                            <label
                                                key={perm}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-indigo-300 cursor-pointer transition-colors has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50"
                                            >
                                                <input
                                                    type="checkbox"
                                                    name={`perm_${perm}`}
                                                    value={perm}
                                                    className="sr-only"
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

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Link
                            href="/admin/team/roles"
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-all"
                        >
                            Create Role
                        </button>
                    </div>
                </form>
            </AdminCard>
        </div>
    )
}
