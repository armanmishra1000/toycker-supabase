import { getAdminOrders } from "@/lib/data/admin"
import { convertToLocale } from "@lib/util/money"
import AdminBadge from "@modules/admin/components/admin-badge"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import { AdminPagination } from "@modules/admin/components/admin-pagination"
import { AdminSearchInput } from "@modules/admin/components/admin-search-input"
import Link from "next/link"
import { ShoppingBagIcon } from "@heroicons/react/24/outline"
import { formatIST } from "@/lib/util/date"
import { ClickableTableRow } from "@modules/admin/components/clickable-table-row"

// Helper to format payment status for display
function getPaymentBadge(paymentStatus: string, paymentMethod?: string | null) {
  // COD orders should show "COD" status, not "Paid"
  const isCOD = paymentMethod === 'manual' || paymentMethod === 'cod' || paymentMethod === 'Cash on Delivery';

  if (isCOD) {
    if (paymentStatus === 'captured' || paymentStatus === 'paid') {
      return { variant: "success" as const, label: "COD Collected" }
    }
    return { variant: "warning" as const, label: "COD Pending" }
  }

  switch (paymentStatus) {
    case "captured":
    case "paid":
      return { variant: "success" as const, label: "Paid" }
    case "awaiting":
    case "pending":
      return { variant: "warning" as const, label: "Pending" }
    case "failed":
      return { variant: "error" as const, label: "Failed" }
    case "refunded":
      return { variant: "neutral" as const, label: "Refunded" }
    default:
      return { variant: "neutral" as const, label: paymentStatus || "—" }
  }
}

// Helper to format fulfillment status for display
function getFulfillmentBadge(fulfillmentStatus: string) {
  switch (fulfillmentStatus) {
    case "shipped":
      return { variant: "info" as const, label: "Shipped" }
    case "delivered":
      return { variant: "success" as const, label: "Delivered" }
    case "not_shipped":
    case "not_fulfilled":
      return { variant: "warning" as const, label: "Not Shipped" }
    case "cancelled":
      return { variant: "error" as const, label: "Cancelled" }
    default:
      return { variant: "neutral" as const, label: fulfillmentStatus || "—" }
  }
}

export default async function AdminOrders({
  searchParams
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const { page = "1", search = "" } = await searchParams
  const pageNumber = parseInt(page, 10) || 1

  const { orders, count, totalPages, currentPage } = await getAdminOrders({
    page: pageNumber,
    limit: 20,
    search: search || undefined
  })

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
    return queryString ? `/admin/orders?${queryString}` : "/admin/orders"
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader title="Orders" />

      {/* Search Bar */}
      <AdminSearchInput defaultValue={search} basePath="/admin/orders" placeholder="Search orders by order ID or customer email..." />

      {/* Results Count */}
      <div className="text-sm text-gray-500">
        Showing {count > 0 ? ((currentPage - 1) * 20) + 1 : 0} to {Math.min(currentPage * 20, count)} of {count} orders
      </div>

      <div className="p-0 border-none shadow-none bg-transparent">
        <div className="bg-white rounded-xl border border-admin-border overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#f7f8f9]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fulfillment</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {orders.length > 0 ? orders.map((order) => {
                // Determine actual payment method (same logic as order detail page)
                const actualPaymentMethod = order.payment_method || (order.payu_txn_id ? 'payu' : 'manual')
                const isCOD = actualPaymentMethod === 'manual' || actualPaymentMethod === 'cod' || actualPaymentMethod === 'Cash on Delivery'

                const paymentBadge = getPaymentBadge(order.payment_status, actualPaymentMethod)
                const fulfillmentBadge = getFulfillmentBadge(order.fulfillment_status)
                const paymentMethodDisplay = isCOD ? 'COD' : (order.payu_txn_id ? 'PayU' : order.payment_method || '—')

                return (
                  <ClickableTableRow
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors tracking-tight">#{order.display_id}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatIST(order.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{order.customer_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <AdminBadge variant={paymentBadge.variant}>
                        {paymentBadge.label}
                      </AdminBadge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600 font-medium">{paymentMethodDisplay}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <AdminBadge variant={fulfillmentBadge.variant}>
                        {fulfillmentBadge.label}
                      </AdminBadge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                      {convertToLocale({ amount: order.total_amount, currency_code: order.currency_code })}
                    </td>
                  </ClickableTableRow>
                )
              }) : (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-gray-500 text-sm">
                    <div className="flex flex-col items-center">
                      <ShoppingBagIcon className="w-12 h-12 text-gray-200 mb-3" />
                      <p className="text-sm font-bold text-gray-900">No orders found</p>
                      {hasSearch ? (
                        <p className="text-xs text-gray-400 mt-1">
                          Try adjusting your search or{" "}
                          <Link href={buildUrl()} className="text-indigo-600 hover:underline">
                            clear the search
                          </Link>
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 mt-1">No orders yet.</p>
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
