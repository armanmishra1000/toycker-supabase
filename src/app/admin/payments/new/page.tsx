import { createPaymentMethod } from "@/lib/data/admin"
import { SubmitButton } from "@/modules/admin/components"
import Link from "next/link"
import AdminCard from "@modules/admin/components/admin-card"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import { ChevronLeftIcon } from "@heroicons/react/24/outline"

export default function NewPaymentMethod() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <nav className="flex items-center gap-2 text-sm font-medium text-gray-500">
        <Link href="/admin/payments" className="flex items-center hover:text-gray-900">
          <ChevronLeftIcon className="h-4 w-4 mr-1" />
          Payments
        </Link>
      </nav>

      <AdminPageHeader title="Add Payment Method" />

      <form action={createPaymentMethod}>
        <AdminCard title="Method Details">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Method ID</label>
              <input name="id" type="text" placeholder="e.g. pp_bank_transfer" required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:ring-0" />
              <p className="mt-1 text-[10px] text-gray-400 uppercase font-bold tracking-tight">Unique identifier for backend logic.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Display Name</label>
              <input name="name" type="text" placeholder="e.g. Bank Transfer" required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:ring-0" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
              <textarea name="description" rows={3} placeholder="Instruction for the customer..." className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:ring-0" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Discount (%)</label>
                <input name="discount_percentage" type="number" step="0.01" min="0" max="100" defaultValue="0" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:ring-0" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                <select name="is_active" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:ring-0">
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </AdminCard>

        <div className="flex gap-2 mt-6">
          <Link href="/admin/payments" className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900">Cancel</Link>
          <SubmitButton loadingText="Saving...">
            Save Method
          </SubmitButton>
        </div>
      </form>
    </div>
  )
}