import { getAdminShippingOptions, deleteShippingOption } from "@/lib/data/admin"
import Link from "next/link"
import { PlusIcon, TrashIcon, TruckIcon } from "@heroicons/react/24/outline"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import AdminCard from "@modules/admin/components/admin-card"
import AdminBadge from "@modules/admin/components/admin-badge"
import { convertToLocale } from "@lib/util/money"

export default async function AdminShipping() {
  const options = await getAdminShippingOptions()

  const actions = (
    <Link
      href="/admin/shipping/new"
      className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-bold rounded-lg shadow-sm text-white bg-black hover:bg-gray-800 transition-all"
    >
      <PlusIcon className="h-4 w-4 mr-2" strokeWidth={3} />
      Add Option
    </Link>
  )

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Shipping"
        subtitle="Manage shipping rates and delivery zones."
        actions={
          <Link href="/admin/shipping/new" className="inline-flex items-center px-4 py-2 bg-gray-900 border border-transparent rounded-lg font-medium text-xs text-white hover:bg-black transition-colors shadow-sm">
            <PlusIcon className="h-4 w-4 mr-2" />
            Add option
          </Link>
        }
      />

      <AdminCard className="p-0 border-none shadow-none bg-transparent">
        <div className="bg-white rounded-xl border border-admin-border overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#f7f8f9]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Free Above</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {options.length > 0 ? options.map((option) => (
                <tr key={option.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-gray-50 text-gray-400 border border-gray-200 group-hover:bg-white transition-all">
                        <TruckIcon className="h-5 w-5" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">{option.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {convertToLocale({ amount: option.amount, currency_code: "inr" })}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {option.min_order_free_shipping
                      ? convertToLocale({ amount: option.min_order_free_shipping, currency_code: "inr" })
                      : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <AdminBadge variant={option.is_active ? "success" : "neutral"}>
                      <span className="capitalize">{option.is_active ? "Active" : "Inactive"}</span>
                    </AdminBadge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <form action={deleteShippingOption.bind(null, option.id)}>
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
                    No shipping options configured yet.
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