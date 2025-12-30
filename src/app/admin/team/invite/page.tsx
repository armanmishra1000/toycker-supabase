import { getAdminRoles, inviteStaffMember } from "@/lib/data/admin"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import AdminCard from "@modules/admin/components/admin-card"
import Link from "next/link"
import { ChevronLeftIcon } from "@heroicons/react/24/outline"
import { redirect } from "next/navigation"

async function handleInvite(formData: FormData) {
    "use server"
    const email = formData.get("email") as string
    const roleId = formData.get("role_id") as string

    await inviteStaffMember(email, roleId)
    redirect("/admin/team")
}

export default async function InviteStaff() {
    const roles = await getAdminRoles()

    return (
        <div className="max-w-lg space-y-6">
            <nav className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                <Link href="/admin/team" className="flex items-center hover:text-black transition-colors">
                    <ChevronLeftIcon className="h-3 w-3 mr-1" strokeWidth={3} />
                    Back to Team
                </Link>
            </nav>

            <AdminPageHeader title="Invite Staff Member" />

            <AdminCard>
                <form action={handleInvite} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            placeholder="colleague@example.com"
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            An invitation email will be sent to this address.
                        </p>
                    </div>

                    <div>
                        <label htmlFor="role_id" className="block text-sm font-medium text-gray-700 mb-1">
                            Role
                        </label>
                        <select
                            id="role_id"
                            name="role_id"
                            required
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="">Select a role...</option>
                            {roles.map((role) => (
                                <option key={role.id} value={role.id}>
                                    {role.name} {role.is_system && '(System)'}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Link
                            href="/admin/team"
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-all"
                        >
                            Send Invitation
                        </button>
                    </div>
                </form>
            </AdminCard>
        </div>
    )
}
