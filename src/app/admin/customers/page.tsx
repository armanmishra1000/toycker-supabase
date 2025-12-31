import { getAdminCustomers } from "@/lib/data/admin"
import AdminCard from "@modules/admin/components/admin-card"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import AdminBadge from "@modules/admin/components/admin-badge"
import Link from "next/link"
import DeleteCustomerButton from "@modules/admin/components/delete-customer-button"
import { UsersIcon } from "@heroicons/react/24/outline"

export default async function AdminCustomers() {
  const customers = await getAdminCustomers()

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Customers" subtitle="Manage your customer details and history." />

      <div className="p-0 border-none shadow-sm bg-transparent">
        <div className="bg-white rounded-xl border border-admin-border overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-[#f9fafb]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Account Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined On</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/admin/customers/${customer.id}`} className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 font-bold text-xs border border-blue-100 group-hover:border-blue-200 transition-all">
                        {customer.first_name ? customer.first_name.charAt(0).toUpperCase() : customer.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {customer.first_name} {customer.last_name}
                        </div>
                        <div className="text-xs text-gray-500">{customer.email}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <AdminBadge variant={(customer as any).role === 'admin' ? "info" : ((customer as any).is_club_member ? "success" : "neutral")}>
                      <span className="capitalize">{(customer as any).role === 'admin' ? 'Administrator' : ((customer as any).is_club_member ? 'Club Member' : 'Customer')}</span>
                    </AdminBadge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(customer.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <DeleteCustomerButton customerId={customer.id} customerName={`${customer.first_name || ''} ${customer.last_name || customer.email}`} />
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-gray-500 text-sm">
                    <div className="flex flex-col items-center justify-center">
                      <UsersIcon className="w-12 h-12 text-gray-200 mb-2" />
                      <p>No customers found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}