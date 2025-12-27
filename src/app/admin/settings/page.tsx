import AdminCard from "@modules/admin/components/admin-card"
import AdminPageHeader from "@modules/admin/components/admin-page-header"

export default function AdminSettings() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <AdminPageHeader title="Store Settings" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <h2 className="text-base font-bold text-gray-900">Store Details</h2>
          <p className="text-sm text-gray-500 mt-1">This information is shown on the storefront and emails.</p>
        </div>
        <div className="lg:col-span-2">
          <AdminCard>
             <div className="space-y-4">
                <div>
                   <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Store Name</label>
                   <input type="text" defaultValue="Toycker" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:ring-0" />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Support Email</label>
                   <input type="email" defaultValue="customercare@toycker.com" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:ring-0" />
                </div>
             </div>
          </AdminCard>
        </div>

        <div className="lg:col-span-1 pt-8 border-t border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Store Currency</h2>
          <p className="text-sm text-gray-500 mt-1">The main currency used across your shop.</p>
        </div>
        <div className="lg:col-span-2 pt-8 border-t border-gray-100">
          <AdminCard>
             <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Currency</label>
                <select className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:ring-0 bg-white" defaultValue="INR">
                   <option value="INR">Indian Rupee (₹)</option>
                   <option value="USD">US Dollar ($)</option>
                </select>
             </div>
          </AdminCard>
        </div>
      </div>
    </div>
  )
}