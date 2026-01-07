import { getAdminRole, updateRole } from "@/lib/data/admin"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import Link from "next/link"
import { ChevronLeftIcon } from "@heroicons/react/24/outline"
import RoleForm from "@modules/admin/components/team/role-form"
import { notFound } from "next/navigation"

export default async function EditRole({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const role = await getAdminRole(id)

    if (!role) {
        notFound()
    }

    const handleUpdate = async (formData: FormData) => {
        "use server"
        await updateRole(id, formData)
    }

    return (
        <div className="max-w-4xl space-y-6">
            <nav className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                <Link
                    href="/admin/team/roles"
                    className="flex items-center hover:text-black transition-colors"
                >
                    <ChevronLeftIcon className="h-3 w-3 mr-1" strokeWidth={3} />
                    Back to Roles
                </Link>
            </nav>

            <AdminPageHeader
                title={`Edit Role: ${role.name}`}
                subtitle="Modify the name and permissions for this role."
            />

            <RoleForm initialData={role} onSubmit={handleUpdate} />
        </div>
    )
}
