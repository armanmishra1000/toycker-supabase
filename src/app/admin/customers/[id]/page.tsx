import { getAdminCustomer } from "@/lib/data/admin"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeftIcon, ShoppingBagIcon, CalendarIcon } from "@heroicons/react/24/outline"
import AdminCard from "@modules/admin/components/admin-card"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import AdminBadge from "@modules/admin/components/admin-badge"
import { convertToLocale } from "@lib/util/money"

export default async function AdminCustomerDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const customer = await getAdminCustomer(id)

  if (!customer) notFound()

  const totalSpent = customer.orders.reduce((acc: number, order: any) => acc + (order.total_amount || 0), 0)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <nav className="flex items-center text-sm font-medium text-gray-500">
        <Link href="/admin/customers" className="flex items-center hover:text-gray-900 transition-colors">
          <ChevronLeftIcon className="h-4 w-4 mr-1" />
          Customers
        </Link>
      </nav>

      <AdminPageHeader 
        title={`${customer.first_name} ${customer.last_name}`} 
        actions={<AdminBadge variant={customer.role === 'admin' ? 'info' : 'neutral'}>{customer.role}</AdminBadge>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <AdminCard title="Order History" className="p-0">
             {customer.orders.length > 0 ? (
               <div className="overflow-x-auto">
                 <table className="min-w-full divide-y divide-gray-100">
                   <thead className="bg-gray-50">
                     <tr>
                       <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Order</th>
                       <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                       <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                       <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Total</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {customer.orders.map((order: any) => (
                       <tr key={order.id} className="hover:bg-gray-50 cursor-pointer">
                         <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                           <Link href={`/admin/orders/${order.id}`}>#{order.display_id}</Link>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                           {new Date(order.created_at).toLocaleDateString()}
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap">
                            <AdminBadge variant={order.status === 'paid' ? 'success' : 'warning'}>{order.status}</AdminBadge>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                           {convertToLocale({ amount: order.total_amount, currency_code: order.currency_code })}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             ) : (
               <div className="p-12 text-center text-gray-500 text-sm font-medium">
                  This customer has not placed any orders yet.
               </div>
             )}
          </AdminCard>
        </div>

        <div className="space-y-6">
          <AdminCard title="Insights">
             <div className="space-y-6">
                <div>
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lifetime Value</p>
                   <p className="text-2xl font-bold text-gray-900 mt-1">{convertToLocale({ amount: totalSpent, currency_code: "inr" })}</p>
                </div>
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      <ShoppingBagIcon className="h-5 w-5" />
                   </div>
                   <div>
                      <p className="text-sm font-bold text-gray-900">{customer.orders.length} Orders</p>
                      <p className="text-xs text-gray-500 font-medium">Placed since joining</p>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <CalendarIcon className="h-5 w-5" />
                   </div>
                   <div>
                      <p className="text-sm font-bold text-gray-900">Joined {new Date(customer.created_at).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-500 font-medium">Member for {Math.floor((Date.now() - new Date(customer.created_at).getTime()) / (1000 * 60 * 60 * 24))} days</p>
                   </div>
                </div>
             </div>
          </AdminCard>

          <AdminCard title="Contact Information">
             <div className="space-y-1 text-sm">
                <p className="font-semibold text-gray-900">{customer.email}</p>
                <p className="text-gray-500 font-medium">{customer.phone || 'No phone number provided'}</p>
             </div>
          </AdminCard>
        </div>
      </div>
    </div>
  )
}