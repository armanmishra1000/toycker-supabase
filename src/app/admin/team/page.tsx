import { getStaffMembers, getAdminRoles, removeStaffAccess } from "@/lib/data/admin"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import AdminCard from "@modules/admin/components/admin-card"
import RoleSelector from "./role-selector"
import Link from "next/link"
import { UserPlusIcon, Cog6ToothIcon, TrashIcon } from "@heroicons/react/24/outline"

export default async function AdminTeam() {
    const [staff, roles] = await Promise.all([
        getStaffMembers().catch(() => []),
        getAdminRoles().catch(() => [])
    ])

    return (
        <div className="space-y-8">
            <AdminPageHeader
                title="Team"
                subtitle="Manage staff accounts and roles."
                actions={
                    <div className="flex gap-2">
                        <Link
                            href="/admin/team/roles"
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all gap-2"
                        >
                            <Cog6ToothIcon className="h-4 w-4" />
                            Manage Roles
                        </Link>
                        <Link
                            href="/admin/team/invite"
                            className="inline-flex items-center px-4 py-2 bg-black text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-all gap-2"
                        >
                            <UserPlusIcon className="h-4 w-4" />
                            Add Staff
                        </Link>
                    </div>
                }
            />

            <AdminCard className="p-0 border-none shadow-none bg-transparent">
                <div className="bg-white rounded-xl border border-admin-border overflow-hidden shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-[#f7f8f9]">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Member</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {staff.length > 0 ? staff.map((member) => (
                                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                                                {(member.first_name?.[0] || member.email[0]).toUpperCase()}
                                            </div>
                                            <span className="text-sm font-semibold text-gray-900">
                                                {member.first_name || member.last_name
                                                    ? `${member.first_name || ''} ${member.last_name || ''}`.trim()
                                                    : member.email.split('@')[0]}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {member.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <RoleSelector
                                            userId={member.id}
                                            currentRoleId={member.admin_role_id || ''}
                                            roles={roles}
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(member.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <form action={removeStaffAccess.bind(null, member.id)}>
                                            <button
                                                type="submit"
                                                className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                                title="Remove access"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 text-sm">
                                        No staff members found. Click "Add Staff" to add team members.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </AdminCard>
        </div>
    )
}

