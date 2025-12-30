import { getAdminRoles, deleteRole } from "@/lib/data/admin"
import { getPermissionLabel } from "@/lib/permissions"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import AdminCard from "@modules/admin/components/admin-card"
import AdminBadge from "@modules/admin/components/admin-badge"
import Link from "next/link"
import { PlusIcon, LockClosedIcon, TrashIcon } from "@heroicons/react/24/outline"

export default async function AdminRoles() {
    const roles = await getAdminRoles()

    return (
        <div className="space-y-8">
            <AdminPageHeader
                title="Roles"
                subtitle="Manage staff roles and permissions."
                actions={
                    <Link
                        href="/admin/team/roles/new"
                        className="inline-flex items-center px-4 py-2 bg-black text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-all gap-2"
                    >
                        <PlusIcon className="h-4 w-4" />
                        Create Role
                    </Link>
                }
            />

            <div className="grid gap-4">
                {roles.map((role) => (
                    <AdminCard key={role.id} className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${role.is_system ? 'bg-gray-100' : 'bg-indigo-50'
                                    }`}>
                                    {role.is_system ? (
                                        <LockClosedIcon className="h-5 w-5 text-gray-500" />
                                    ) : (
                                        <span className="text-indigo-600 font-bold text-sm">
                                            {role.name[0].toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-bold text-gray-900">{role.name}</h3>
                                        {role.is_system && (
                                            <AdminBadge variant="neutral">System</AdminBadge>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {role.permissions.length === 1 && role.permissions[0] === '*'
                                            ? 'Full Access'
                                            : `${role.permissions.length} permissions`}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {!role.is_system && (
                                    <form action={deleteRole.bind(null, role.id)}>
                                        <button
                                            type="submit"
                                            className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                                            title="Delete role"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>

                        {/* Permissions list */}
                        <div className="mt-3 flex flex-wrap gap-1">
                            {role.permissions.slice(0, 6).map((perm) => (
                                <span
                                    key={perm}
                                    className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                                >
                                    {getPermissionLabel(perm)}
                                </span>
                            ))}
                            {role.permissions.length > 6 && (
                                <span className="text-[10px] font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                                    +{role.permissions.length - 6} more
                                </span>
                            )}
                        </div>
                    </AdminCard>
                ))}
            </div>
        </div>
    )
}
