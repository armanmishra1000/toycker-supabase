"use client"

import { updatePaymentMethod } from "@/lib/data/admin"
import { PaymentProvider } from "@/lib/supabase/types"
import AdminCard from "@modules/admin/components/admin-card"
import { SubmitButton } from "@modules/admin/components/submit-button"
import { CreditCard, Info, Percent, Settings, ShieldCheck, Activity } from "lucide-react"

export default function PaymentProviderForm({ method }: { method: PaymentProvider }) {
    const updateAction = updatePaymentMethod.bind(null, method.id)

    return (
        <form action={updateAction} className="space-y-6">
            <AdminCard
                title="Provider Configuration"
                footer={
                    <div className="flex items-center justify-end w-full gap-3">
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-black transition-colors uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                        <SubmitButton
                            loadingText="Saving Changes..."
                            className="px-8 py-2.5 bg-black text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-all shadow-lg active:scale-95"
                        >
                            Save Changes
                        </SubmitButton>
                    </div>
                }
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* General Info Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-50 mb-2">
                            <Info className="w-3.5 h-3.5 text-gray-400" />
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">General Information</h4>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="name" className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                Provider Name
                            </label>
                            <div className="relative">
                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    defaultValue={method.name}
                                    required
                                    className="block w-full rounded-lg border-gray-200 pl-10 pr-4 py-2.5 text-sm font-medium focus:border-black focus:ring-0 transition-all bg-gray-50/30"
                                    placeholder="e.g. PayU, Stripe"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="id_display" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                Identifier
                            </label>
                            <div className="relative group">
                                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                <input
                                    type="text"
                                    id="id_display"
                                    value={method.id}
                                    disabled
                                    className="block w-full rounded-lg border-gray-200 bg-gray-50/50 pl-10 pr-4 py-2.5 text-sm font-mono text-gray-500 cursor-not-allowed"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase">Immutable</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Settings Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-50 mb-2">
                            <Settings className="w-3.5 h-3.5 text-gray-400" />
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Backend Settings</h4>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="discount_percentage" className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                Payment Discount
                            </label>
                            <div className="relative">
                                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                <input
                                    type="number"
                                    name="discount_percentage"
                                    id="discount_percentage"
                                    defaultValue={method.discount_percentage || 0}
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    className="block w-full rounded-lg border-gray-200 pl-10 pr-10 py-2.5 text-sm font-black focus:border-black focus:ring-0 transition-all"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 font-bold text-xs">
                                    %
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-400 font-medium italic">Applied automatically during checkout.</p>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="is_active" className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                Availability Status
                            </label>
                            <div className="relative">
                                <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 z-10" />
                                <select
                                    name="is_active"
                                    id="is_active"
                                    defaultValue={method.is_active.toString()}
                                    className="block w-full rounded-lg border-gray-200 pl-10 pr-4 py-2.5 text-sm font-bold focus:border-black focus:ring-0 appearance-none bg-white cursor-pointer"
                                >
                                    <option value="true">Active (Live)</option>
                                    <option value="false">Inactive (Hidden)</option>
                                </select>
                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description - Full Width */}
                    <div className="md:col-span-2 space-y-2 pt-2">
                        <label htmlFor="description" className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            Public Description
                        </label>
                        <textarea
                            name="description"
                            id="description"
                            rows={3}
                            defaultValue={method.description || ""}
                            className="block w-full rounded-lg border-gray-200 px-4 py-3 text-sm font-medium focus:border-black focus:ring-0 transition-all bg-gray-50/30"
                            placeholder="Visible to customers in checkout..."
                        />
                    </div>
                </div>
            </AdminCard>
        </form>
    )
}
