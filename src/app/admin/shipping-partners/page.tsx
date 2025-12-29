import { getShippingPartners, deleteShippingPartner } from "@/lib/data/admin"
import Link from "next/link"
import { PlusIcon, TrashIcon, TruckIcon } from "@heroicons/react/24/outline"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import AdminCard from "@modules/admin/components/admin-card"
import AdminBadge from "@modules/admin/components/admin-badge"

export default async function AdminShippingPartners() {
    const partners = await getShippingPartners()

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Shipping Partners"
                subtitle="Manage delivery partners for order fulfillment."
                actions={
                    <Link href="/admin/shipping-partners/new" className="inline-flex items-center px-4 py-2 bg-gray-900 border border-transparent rounded-lg font-medium text-xs text-white hover:bg-black transition-colors shadow-sm">
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Partner
                    </Link>
                }
            />

            <AdminCard className="p-0 border-none shadow-none bg-transparent">
                <div className="bg-white rounded-xl border border-admin-border overflow-hidden shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-[#f7f8f9]">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Partner Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {partners.length > 0 ? partners.map((partner) => (
                                <tr key={partner.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 group-hover:bg-white transition-all">
                                                <TruckIcon className="h-5 w-5" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-semibold text-gray-900">{partner.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <AdminBadge variant={partner.is_active ? "success" : "neutral"}>
                                            <span className="capitalize">{partner.is_active ? "Active" : "Inactive"}</span>
                                        </AdminBadge>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(partner.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <form action={deleteShippingPartner.bind(null, partner.id)}>
                                                <button className="p-1.5 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded transition-colors">
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500 text-sm">
                                        No shipping partners configured yet.
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
