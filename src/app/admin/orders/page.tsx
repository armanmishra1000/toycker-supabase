import { getAdminOrders } from "@/lib/data/admin"
import { convertToLocale } from "@lib/util/money"
import AdminBadge from "@modules/admin/components/admin-badge"
import AdminCard from "@modules/admin/components/admin-card"
import AdminPageHeader from "@modules/admin/components/admin-page-header"

export default async function AdminOrders() {
  const orders = await getAdminOrders()

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Orders" />

      <AdminCard className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Payment Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {orders.length > 0 ? orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    #{order.display_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                    {new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{order.customer_email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <AdminBadge variant={order.status === 'paid' ? "success" : "warning"}>
                      {order.status}
                    </AdminBadge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                    {convertToLocale({ amount: order.total_amount, currency_code: order.currency_code })}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 text-sm">
                    No orders have been placed yet.
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