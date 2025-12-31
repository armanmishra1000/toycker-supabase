import { getAdminRoles, promoteToStaff } from "@/lib/data/admin"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import AdminCard from "@modules/admin/components/admin-card"
import SearchableUserSelect from "./user-selector"
import Link from "next/link"
import { ChevronLeftIcon } from "@heroicons/react/24/outline"
import { redirect } from "next/navigation"

async function handlePromotion(formData: FormData) {
    "use server"
    const userId = formData.get("user_id") as string
    const roleId = formData.get("role_id") as string

    await promoteToStaff(userId, roleId)
    redirect("/admin/team")
}

export default async function AddStaff() {
    const roles = await getAdminRoles()

    return (
        <div className="max-w-lg space-y-6">
            <nav className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                <Link href="/admin/team" className="flex items-center hover:text-black transition-colors">
                    <ChevronLeftIcon className="h-3 w-3 mr-1" strokeWidth={3} />
                    Back to Team
                </Link>
            </nav>

            <AdminPageHeader
                title="Add Staff Member"
                subtitle="Select a registered user to promote to staff."
            />

            <AdminCard>
                <form action={handlePromotion} className="space-y-6">
                    <div>
                        <SearchableUserSelect />
                        <p className="text-xs text-gray-500 mt-2">
                            Only registered users who are not already staff will appear.
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
                            Add to Team
                        </button>
                    </div>
                </form>
            </AdminCard>
        </div>
    )
}
