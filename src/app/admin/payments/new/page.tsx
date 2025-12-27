import { createPaymentMethod } from "@/lib/data/admin"
import Link from "next/link"
import AdminCard from "@modules/admin/components/admin-card"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import { ChevronLeftIcon } from "@heroicons/react/24/outline"

export default function NewPaymentMethod() {
  const actions = (
    <div className="flex gap-2">
      <Link href="/admin/payments" className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900">Cancel</Link>
      <button form="payment-form" type="submit" className="px-4 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-all">
        Save Method
      </button>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <nav className="flex items-center gap-2 text-sm font-medium text-gray-500">
        <Link href="/admin/payments" className="flex items-center hover:text-gray-900">
          <ChevronLeftIcon className="h-4 w-4 mr-1" />
          Payments
        </Link>
      </nav>

      <AdminPageHeader title="Add Payment Method" actions={actions} />

      <form id="payment-form" action={createPaymentMethod}>
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
          </div>
        </AdminCard>
      </form>
    </div>
  )
}