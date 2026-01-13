import { createShippingPartner } from "@/lib/data/admin"
import { SubmitButton } from "@/modules/admin/components"
import Link from "next/link"
import { ChevronLeftIcon } from "@heroicons/react/24/outline"
import AdminCard from "@modules/admin/components/admin-card"

export default function NewShippingPartner() {
    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <nav className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                <Link href="/admin/shipping-partners" className="flex items-center hover:text-black transition-colors">
                    <ChevronLeftIcon className="h-3 w-3 mr-1" strokeWidth={3} />
                    Back to Shipping Partners
                </Link>
            </nav>

            <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Add Shipping Partner</h1>

            <AdminCard>
                <form action={createShippingPartner} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-2">
                            Partner Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            required
                            placeholder="e.g., Delhivery, Shiprocket, Blue Dart"
                            className="block w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                        />
                        <p className="mt-2 text-xs text-gray-500">
                            Enter the name of the delivery partner. This will appear in the fulfillment dropdown.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Link
                            href="/admin/shipping-partners"
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </Link>
                        <SubmitButton loadingText="Adding...">
                            Add Partner
                        </SubmitButton>
                    </div>
                </form>
            </AdminCard>
        </div>
    )
}
