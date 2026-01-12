import { getAdminPromotions, deletePromotion, togglePromotion } from "@/lib/data/promotions"
import Link from "next/link"
import { PlusIcon, TrashIcon, TicketIcon, CalendarIcon } from "@heroicons/react/24/outline"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import AdminCard from "@modules/admin/components/admin-card"
import AdminBadge from "@modules/admin/components/admin-badge"
import { convertToLocale } from "@lib/util/money"

export default async function AdminDiscounts() {
    const promotions = await getAdminPromotions()

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Discounts"
                subtitle="Manage coupon codes and promotional offers."
                actions={
                    <Link href="/admin/discounts/new" className="inline-flex items-center px-4 py-2 bg-gray-900 border border-transparent rounded-lg font-medium text-xs text-white hover:bg-black transition-colors shadow-sm">
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Create Discount
                    </Link>
                }
            />

            <AdminCard className="p-0 border-none shadow-none bg-transparent">
                <div className="bg-white rounded-xl border border-admin-border overflow-hidden shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-[#f7f8f9]">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {promotions.length > 0 ? (
                                promotions.map((promo) => (
                                    <tr key={promo.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100 transition-all">
                                                    <TicketIcon className="h-5 w-5" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-bold text-gray-900 tracking-tight">{promo.code}</div>
                                                    <div className="flex items-center text-xs text-gray-500 mt-0.5">
                                                        <CalendarIcon className="h-3 w-3 mr-1" />
                                                        {promo.ends_at ? `Exp: ${new Date(promo.ends_at).toLocaleDateString()}` : "No expiry"}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {promo.type === "percentage"
                                                    ? `${promo.value}% Off`
                                                    : promo.type === "fixed"
                                                        ? `${convertToLocale({ amount: promo.value, currency_code: "inr" })} Off`
                                                        : "Free Shipping"}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {promo.min_order_amount > 0 ? `Min purchase: ₹${promo.min_order_amount}` : "No minimum"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {promo.used_count} {promo.max_uses ? `/ ${promo.max_uses}` : "uses"}
                                            </div>
                                            <div className="w-24 bg-gray-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                                <div
                                                    className="bg-blue-600 h-full rounded-full"
                                                    style={{ width: promo.max_uses ? `${Math.min(100, (promo.used_count / promo.max_uses) * 100)}%` : "0%" }}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <AdminBadge variant={promo.is_active ? "success" : "neutral"}>
                                                {promo.is_active ? "Active" : "Disabled"}
                                            </AdminBadge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <form action={deletePromotion.bind(null, promo.id)}>
                                                    <button className="p-1.5 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded transition-colors">
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </form>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 text-sm font-medium">
                                        No discount codes created yet.
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
