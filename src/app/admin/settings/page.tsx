import AdminCard from "@modules/admin/components/admin-card"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import { getGlobalSettings } from "@/lib/data/settings"
import GiftWrapSettings from "@modules/admin/components/settings/gift-wrap-settings"
import VisualSearchSettings from "@modules/admin/components/settings/visual-search-settings"

export default async function AdminSettings() {
  const globalSettings = await getGlobalSettings()

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <AdminPageHeader title="Store Settings" subtitle="Manage your store details and preferences." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <h2 className="text-sm font-semibold text-gray-900">Store Details</h2>
          <p className="text-sm text-gray-500 mt-1">This information is shown on the storefront and emails.</p>
        </div>
        <div className="lg:col-span-2">
          <AdminCard>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                <input type="text" defaultValue="Toycker" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors shadow-sm" disabled />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
                <input type="email" defaultValue="customercare@toycker.com" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors shadow-sm" disabled />
              </div>
            </div>
          </AdminCard>
        </div>

        <div className="lg:col-span-1 border-t border-gray-200 pt-8">
          <h2 className="text-sm font-semibold text-gray-900">Add-ons</h2>
          <p className="text-sm text-gray-500 mt-1">Configure additional services like gift wrapping.</p>
        </div>
        <div className="lg:col-span-2 border-t border-gray-200 pt-8 flex flex-col gap-8">
          <GiftWrapSettings initialSettings={globalSettings} />
        </div>

        <div className="lg:col-span-1 border-t border-gray-200 pt-8">
          <h2 className="text-sm font-semibold text-gray-900">Visual Search</h2>
          <p className="text-sm text-gray-500 mt-1">Manage image search indexing and performance.</p>
        </div>
        <div className="lg:col-span-2 border-t border-gray-200 pt-8">
          <VisualSearchSettings />
        </div>

        <div className="lg:col-span-1 pt-8 border-t border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Store Currency</h2>
          <p className="text-sm text-gray-500 mt-1">The main currency used across your shop.</p>
        </div>
        <div className="lg:col-span-2 pt-8 border-t border-gray-200">
          <AdminCard>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white shadow-sm" defaultValue="INR" disabled>
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