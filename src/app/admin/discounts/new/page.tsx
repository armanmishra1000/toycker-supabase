import { createPromotion } from "@/lib/data/promotions"
import { SubmitButton } from "@/modules/admin/components"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import AdminCard from "@modules/admin/components/admin-card"
import Link from "next/link"
import { ChevronLeftIcon } from "@heroicons/react/24/outline"

export default function NewDiscount() {
    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <Link href="/admin/discounts" className="hover:text-black flex items-center transition-colors">
                    <ChevronLeftIcon className="h-3 w-3 mr-1" />
                    Back to Discounts
                </Link>
            </div>

            <AdminPageHeader
                title="Create New Discount"
                subtitle="Define rules and conditions for your new promotional code."
            />

            <form action={createPromotion}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <AdminCard title="General Information">
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="code" className="block text-sm font-bold text-gray-700 mb-1">
                                        Discount Code
                                    </label>
                                    <input
                                        type="text"
                                        name="code"
                                        id="code"
                                        required
                                        placeholder="e.g. SUMMER20"
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all uppercase font-mono font-bold"
                                    />
                                    <p className="mt-1.5 text-[11px] text-gray-500 font-medium">Customers will enter this code at checkout.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="type" className="block text-sm font-bold text-gray-700 mb-1">
                                            Type
                                        </label>
                                        <select
                                            name="type"
                                            id="type"
                                            required
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                        >
                                            <option value="percentage">Percentage Off (%)</option>
                                            <option value="fixed">Fixed Amount (₹)</option>
                                            <option value="free_shipping">Free Shipping</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="value" className="block text-sm font-bold text-gray-700 mb-1">
                                            Value
                                        </label>
                                        <input
                                            type="number"
                                            name="value"
                                            id="value"
                                            step="0.01"
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </AdminCard>

                        <AdminCard title="Conditions">
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="min_order_amount" className="block text-sm font-bold text-gray-700 mb-1">
                                        Minimum Purchase (Optional)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-2.5 text-gray-400 font-medium text-sm">₹</span>
                                        <input
                                            type="number"
                                            name="min_order_amount"
                                            id="min_order_amount"
                                            placeholder="0.00"
                                            className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                        />
                                    </div>
                                    <p className="mt-1.5 text-[11px] text-gray-500 font-medium">The discount only applies if the cart total is above this amount.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div>
                                        <label htmlFor="starts_at" className="block text-sm font-bold text-gray-700 mb-1">
                                            Starts At
                                        </label>
                                        <input
                                            type="datetime-local"
                                            name="starts_at"
                                            id="starts_at"
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="ends_at" className="block text-sm font-bold text-gray-700 mb-1">
                                            Ends At
                                        </label>
                                        <input
                                            type="datetime-local"
                                            name="ends_at"
                                            id="ends_at"
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </AdminCard>
                    </div>

                    <div className="space-y-6">
                        <AdminCard title="Status & Limits">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-1">
                                    <div>
                                        <span className="block text-sm font-bold text-gray-700">Active</span>
                                        <span className="text-[11px] text-gray-500 font-medium">Enable this discount now</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        defaultChecked
                                        className="h-5 w-5 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                                    />
                                </div>

                                <hr className="border-gray-100" />

                                <div>
                                    <label htmlFor="max_uses" className="block text-sm font-bold text-gray-700 mb-1">
                                        Usage Limit (Optional)
                                    </label>
                                    <input
                                        type="number"
                                        name="max_uses"
                                        id="max_uses"
                                        placeholder="Unlimited"
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                    />
                                    <p className="mt-1.5 text-[11px] text-gray-500 font-medium">Limit how many times this code can used globally.</p>
                                </div>
                            </div>
                        </AdminCard>

                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 space-y-4">
                            <SubmitButton className="w-full px-6 py-3 active:scale-[0.98]" loadingText="Creating...">
                                Create Discount
                            </SubmitButton>
                            <Link
                                href="/admin/discounts"
                                className="block w-full text-center px-6 py-3 bg-white border border-gray-200 hover:border-gray-400 text-gray-700 font-bold rounded-xl transition-all shadow-sm active:scale-[0.98]"
                            >
                                Cancel
                            </Link>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}
