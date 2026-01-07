import { createRole } from "@/lib/data/admin"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import Link from "next/link"
import { ChevronLeftIcon } from "@heroicons/react/24/outline"
import RoleForm from "@modules/admin/components/team/role-form"

export default function NewRole() {
    const handleCreate = async (formData: FormData) => {
        "use server"
        await createRole(formData)
    }

    return (
        <div className="max-w-4xl space-y-6">
            <nav className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                <Link href="/admin/team/roles" className="flex items-center hover:text-black transition-colors">
                    <ChevronLeftIcon className="h-3 w-3 mr-1" strokeWidth={3} />
                    Back to Roles
                </Link>
            </nav>

            <AdminPageHeader title="Create Role" subtitle="Define a new role and its permissions." />

            <RoleForm onSubmit={handleCreate} />
        </div>
    )
}
