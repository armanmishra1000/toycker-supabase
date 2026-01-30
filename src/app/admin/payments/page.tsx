import { getAdminPaymentMethods, deletePaymentMethod } from "@/lib/data/admin"
import Link from "next/link"
import { PlusIcon, TrashIcon, CreditCardIcon, PencilSquareIcon } from "@heroicons/react/24/outline"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import AdminCard from "@modules/admin/components/admin-card"
import AdminBadge from "@modules/admin/components/admin-badge"
import { ProtectedAction } from "@/lib/permissions/components/protected-action"
import { PERMISSIONS } from "@/lib/permissions"

export default async function AdminPayments() {
  const methods = await getAdminPaymentMethods()



  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Payments"
        subtitle="Manage available payment methods for checkout."
        actions={
          <ProtectedAction permission={PERMISSIONS.PAYMENTS_CREATE} hideWhenDisabled>
            <Link href="/admin/payments/new" className="inline-flex items-center px-4 py-2 bg-gray-900 border border-transparent rounded-lg font-medium text-xs text-white hover:bg-black transition-colors shadow-sm">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add method
            </Link>
          </ProtectedAction>
        }
      />

      <AdminCard className="p-0 border-none shadow-none bg-transparent">
        <div className="bg-white rounded-xl border border-admin-border overflow-x-auto shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#f7f8f9]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {methods.length > 0 ? methods.map((method) => (
                <tr key={method.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-gray-50 text-gray-400 border border-gray-200 group-hover:bg-white transition-all">
                        <CreditCardIcon className="h-5 w-5" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">{method.name}</div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5 uppercase">{method.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {method.description || 'No description provided'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <AdminBadge variant={method.is_active ? "success" : "neutral"}>
                      <span className="capitalize">{method.is_active ? "Active" : "Inactive"}</span>
                    </AdminBadge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ProtectedAction permission={PERMISSIONS.PAYMENTS_UPDATE} hideWhenDisabled>
                        <Link
                          href={`/admin/payments/${method.id}`}
                          className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </ProtectedAction>
                      <ProtectedAction permission={PERMISSIONS.PAYMENTS_DELETE} hideWhenDisabled>
                        <form action={deletePaymentMethod.bind(null, method.id)}>
                          <button className="p-1.5 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded transition-colors">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </form>
                      </ProtectedAction>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500 text-sm">
                    No payment methods configured yet.
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