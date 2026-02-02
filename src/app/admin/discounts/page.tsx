import { getAdminPromotions } from "@/lib/data/promotions"
import Link from "next/link"
import { PlusIcon, TicketIcon, CalendarIcon, PencilIcon } from "@heroicons/react/24/outline"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import AdminCard from "@modules/admin/components/admin-card"
import AdminBadge from "@modules/admin/components/admin-badge"
import { convertToLocale } from "@lib/util/money"
import { ClickableTableRow } from "@modules/admin/components/clickable-table-row"
import DeletePromotionButton from "@modules/admin/components/delete-promotion-button"
import { ProtectedAction } from "@/lib/permissions/components/protected-action"
import { PERMISSIONS } from "@/lib/permissions"
import { AdminTableWrapper } from "@modules/admin/components/admin-table-wrapper"
import { getPromotionStatus } from "@/lib/util/promotion"

export default async function AdminDiscounts({
    searchParams
}: {
    searchParams: Promise<{ tab?: string }>
}) {
    const { tab: tabParam } = await searchParams
    const tab = (tabParam as "active" | "history") || "active"
    const promotions = await getAdminPromotions(tab)

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Discounts"
                subtitle="Manage coupon codes and promotional offers."
                actions={
                    <ProtectedAction permission={PERMISSIONS.DISCOUNTS_CREATE} hideWhenDisabled>
                        <Link href="/admin/discounts/new" className="inline-flex items-center px-4 py-2 bg-gray-900 border border-transparent rounded-lg font-medium text-xs text-white hover:bg-black transition-colors shadow-sm">
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Create Discount
                        </Link>
                    </ProtectedAction>
                }
            />

            <div className="flex items-center gap-1 bg-gray-100/50 p-1 rounded-xl w-fit border border-gray-200/50">
                <Link
                    href="/admin/discounts?tab=active"
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === "active"
                        ? "bg-white text-black shadow-sm"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                        }`}
                >
                    Active
                </Link>
                <Link
                    href="/admin/discounts?tab=history"
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === "history"
                        ? "bg-white text-black shadow-sm"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                        }`}
                >
                    History
                </Link>
            </div>

            <AdminCard className="p-0 border-none shadow-none bg-transparent">
                <AdminTableWrapper className="bg-white rounded-xl border border-admin-border shadow-sm">
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
                                promotions.map((promo) => {
                                    const status = getPromotionStatus(promo)
                                    return (
                                        <ClickableTableRow
                                            key={promo.id}
                                            href={`/admin/discounts/${promo.id}`}
                                            className="hover:bg-gray-50 transition-colors group cursor-pointer"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 transition-all group-hover:scale-110">
                                                        <TicketIcon className="h-5 w-5" />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-bold text-gray-900 tracking-tight group-hover:text-indigo-600 transition-colors uppercase">{promo.code}</div>
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
                                                        className="bg-indigo-600 h-full rounded-full"
                                                        style={{ width: promo.max_uses ? `${Math.min(100, (promo.used_count / promo.max_uses) * 100)}%` : "0%" }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <AdminBadge
                                                    variant={
                                                        status === "active" ? "success" :
                                                            status === "scheduled" ? "info" :
                                                                status === "expired" ? "warning" : "critical"
                                                    }
                                                >
                                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                                </AdminBadge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-2 relative z-20">
                                                    <ProtectedAction permission={PERMISSIONS.DISCOUNTS_UPDATE} hideWhenDisabled>
                                                        <Link
                                                            href={`/admin/discounts/${promo.id}`}
                                                            className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded transition-colors"
                                                        >
                                                            <PencilIcon className="h-4 w-4" />
                                                        </Link>
                                                    </ProtectedAction>
                                                    {!promo.is_deleted && (
                                                        <ProtectedAction permission={PERMISSIONS.DISCOUNTS_DELETE} hideWhenDisabled>
                                                            <DeletePromotionButton promoId={promo.id} promoCode={promo.code} />
                                                        </ProtectedAction>
                                                    )}
                                                </div>
                                            </td>
                                        </ClickableTableRow>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 text-sm font-medium">
                                        {tab === "active" ? "No active discount codes." : "No discount history found."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </AdminTableWrapper>
            </AdminCard>
        </div>
    )
}
