"use client"

import { updateStaffRole } from "@/lib/data/admin"

type RoleSelectorProps = {
    userId: string
    currentRoleId: string
    roles: { id: string; name: string; is_system: boolean }[]
}

export default function RoleSelector({
    userId,
    currentRoleId,
    roles,
}: RoleSelectorProps) {
    const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const roleId = e.target.value
        if (roleId && roleId !== currentRoleId) {
            await updateStaffRole(userId, roleId)
        }
    }

    return (
        <select
            name="role_id"
            defaultValue={currentRoleId}
            onChange={handleChange}
            className="text-xs font-medium bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
        >
            {roles.map((role) => (
                <option key={role.id} value={role.id}>
                    {role.name}
                </option>
            ))}
        </select>
    )
}
