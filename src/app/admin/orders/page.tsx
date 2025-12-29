import { getAdminOrders } from "@/lib/data/admin"
import { convertToLocale } from "@lib/util/money"
import AdminBadge from "@modules/admin/components/admin-badge"
import AdminCard from "@modules/admin/components/admin-card"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import Link from "next/link"

// Helper to format payment status for display
function getPaymentBadge(paymentStatus: string) {
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

export default async function AdminOrders() {
  const orders = await getAdminOrders()

  return (
    <div className="space-y-8">
      <AdminPageHeader title="Orders" />

      <AdminCard className="p-0 border-none shadow-none bg-transparent">
        <div className="bg-white rounded-xl border border-admin-border overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#f7f8f9]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fulfillment</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {orders.length > 0 ? orders.map((order) => {
                const paymentBadge = getPaymentBadge(order.payment_status)
                const fulfillmentBadge = getFulfillmentBadge(order.fulfillment_status)

                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors cursor-pointer group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/admin/orders/${order.id}`} className="block">
                        <span className="text-sm font-semibold text-gray-900 hover:underline">#{order.display_id}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
                      <AdminBadge variant={fulfillmentBadge.variant}>
                        {fulfillmentBadge.label}
                      </AdminBadge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                      {convertToLocale({ amount: order.total_amount, currency_code: order.currency_code })}
                    </td>
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 text-sm">
                    No orders found.
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