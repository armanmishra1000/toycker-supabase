import { getStaffMembers, getAdminRoles, removeStaffAccess } from "@/lib/data/admin"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import { AdminPagination } from "@modules/admin/components/admin-pagination"
import { AdminSearchInput } from "@modules/admin/components/admin-search-input"
import RoleSelector from "./role-selector"
import Link from "next/link"
import { UserPlusIcon, Cog6ToothIcon, TrashIcon, UserGroupIcon } from "@heroicons/react/24/outline"
import { ProtectedAction } from "@/lib/permissions/components/protected-action"
import { PERMISSIONS } from "@/lib/permissions"
import { formatIST } from "@/lib/util/date"

export default async function AdminTeam({
    searchParams
}: {
    searchParams: Promise<{ page?: string; search?: string }>
}) {
    const { page = "1", search = "" } = await searchParams
    const pageNumber = parseInt(page, 10) || 1

    const [staffData, roles] = await Promise.all([
        getStaffMembers({
            page: pageNumber,
            limit: 20,
            search: search || undefined
        }).catch(() => ({ staff: [], count: 0, totalPages: 1, currentPage: 1 })),
        getAdminRoles().catch(() => [])
    ])

    const { staff: staffMembers, count, totalPages, currentPage } = staffData

    const hasSearch = search && search.trim().length > 0
    const buildUrl = (newPage?: number, clearSearch = false) => {
        const params = new URLSearchParams()
        if (newPage && newPage > 1) {
            params.set("page", newPage.toString())
        }
        if (!clearSearch && hasSearch) {
            params.set("search", search)
        }
        const queryString = params.toString()
        return queryString ? `/admin/team?${queryString}` : "/admin/team"
    }

    return (
        <div className="space-y-8">
            <AdminPageHeader
                title="Team"
                subtitle="Manage staff accounts and roles."
                actions={
                    <ProtectedAction permission={PERMISSIONS.TEAM_MANAGE} hideWhenDisabled>
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
                    </ProtectedAction>
                }
            />

            {/* Search Bar */}
            <AdminSearchInput defaultValue={search} basePath="/admin/team" placeholder="Search staff by name or email..." />

            {/* Results Count */}
            <div className="text-sm text-gray-500">
                Showing {count > 0 ? ((currentPage - 1) * 20) + 1 : 0} to {Math.min(currentPage * 20, count)} of {count} staff members
            </div>

            <div className="p-0 border-none shadow-none bg-transparent">
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
                            {staffMembers.length > 0 ? staffMembers.map((member) => (
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
                                        <ProtectedAction
                                            permission={PERMISSIONS.TEAM_MANAGE}
                                            fallback={
                                                <div className="text-xs font-medium bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 inline-block">
                                                    {roles.find(r => r.id === member.admin_role_id)?.name || 'No Role'}
                                                </div>
                                            }
                                        >
                                            <RoleSelector
                                                userId={member.id}
                                                currentRoleId={member.admin_role_id || ''}
                                                roles={roles}
                                            />
                                        </ProtectedAction>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatIST(member.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <ProtectedAction permission={PERMISSIONS.TEAM_MANAGE} hideWhenDisabled>
                                            <form action={removeStaffAccess.bind(null, member.id)}>
                                                <button
                                                    type="submit"
                                                    className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                                    title="Remove access"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </form>
                                        </ProtectedAction>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-gray-500 text-sm">
                                        <div className="flex flex-col items-center">
                                            <UserGroupIcon className="w-12 h-12 text-gray-200 mb-3" />
                                            <p className="text-sm font-bold text-gray-900">No staff members found</p>
                                            {hasSearch ? (
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Try adjusting your search or{" "}
                                                    <Link href={buildUrl()} className="text-indigo-600 hover:underline">
                                                        clear the search
                                                    </Link>
                                                </p>
                                            ) : (
                                                <p className="text-xs text-gray-400 mt-1">Click &quot;Add Staff&quot; to add team members.</p>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <AdminPagination currentPage={currentPage} totalPages={totalPages} />
            </div>
        </div>
    )
}
