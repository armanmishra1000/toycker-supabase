import { getShippingOption, updateShippingOption } from "@/lib/data/admin"
import Link from "next/link"
import AdminCard from "@modules/admin/components/admin-card"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import { ChevronLeftIcon } from "@heroicons/react/24/outline"
import { notFound } from "next/navigation"

export default async function EditShippingOption({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const option = await getShippingOption(id)

    if (!option) {
        notFound()
    }

    const updateWithId = updateShippingOption.bind(null, id)

    const actions = (
        <div className="flex gap-2">
            <Link href="/admin/shipping" className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">Cancel</Link>
            <button form="shipping-form" type="submit" className="px-4 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-all shadow-sm">
                Update Option
            </button>
        </div>
    )

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <nav className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <Link href="/admin/shipping" className="flex items-center hover:text-gray-900 transition-colors">
                    <ChevronLeftIcon className="h-4 w-4 mr-1" />
                    Shipping
                </Link>
            </nav>

            <AdminPageHeader title={`Edit ${option.name}`} actions={actions} />

            <form id="shipping-form" action={updateWithId}>
                <AdminCard title="Option Details">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Display Name</label>
                            <input
                                name="name"
                                type="text"
                                defaultValue={option.name}
                                placeholder="e.g. Express Delivery"
                                required
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:ring-0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Amount (INR)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">₹</span>
                                <input
                                    name="amount"
                                    type="number"
                                    step="0.01"
                                    defaultValue={option.amount}
                                    placeholder="0.00"
                                    required
                                    className="w-full rounded-lg border border-gray-300 pl-7 pr-4 py-2.5 text-sm font-black focus:border-black focus:ring-0"
                                />
                            </div>
                        </div>

                        <div className="pt-2 border-t border-gray-100 mt-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Free Shipping Threshold (Optional)</label>
                            <p className="text-xs text-gray-500 mb-2">Orders above this amount will qualify for free shipping.</p>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">₹</span>
                                <input
                                    name="min_order_free_shipping"
                                    type="number"
                                    step="0.01"
                                    defaultValue={option.min_order_free_shipping || ""}
                                    placeholder="Leave empty for always charge"
                                    className="w-full rounded-lg border border-gray-300 pl-7 pr-4 py-2.5 text-sm font-medium focus:border-black focus:ring-0"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                            <select
                                name="is_active"
                                defaultValue={option.is_active ? "true" : "false"}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:ring-0"
                            >
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </select>
                        </div>
                    </div>
                </AdminCard>
            </form>
        </div>
    )
}
