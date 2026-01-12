"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { fulfillOrder } from "@/lib/data/admin"
import { ShippingPartner } from "@/lib/supabase/types"
import { XMarkIcon, TruckIcon } from "@heroicons/react/24/outline"

interface FulfillmentModalProps {
    orderId: string
    shippingPartners: ShippingPartner[]
}

function FulfillButton({ disabled }: { disabled: boolean }) {
    const { pending } = useFormStatus()

    return (
        <button
            type="submit"
            disabled={pending || disabled}
            className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px]"
        >
            {pending ? (
                <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Fulfilling...</span>
                </>
            ) : (
                "Fulfill Order"
            )}
        </button>
    )
}

export default function FulfillmentModal({ orderId, shippingPartners }: FulfillmentModalProps) {
    const [isOpen, setIsOpen] = useState(false)

    const handleSubmit = async (formData: FormData) => {
        try {
            await fulfillOrder(orderId, formData)
            setIsOpen(false)
        } catch (error) {
            console.error("Error fulfilling order:", error)
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-sm"
            >
                Fulfill Items
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Modal */}
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                                    <TruckIcon className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Fulfill Order</h2>
                                    <p className="text-xs text-gray-500">Select shipping partner and add tracking</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <XMarkIcon className="h-5 w-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Form */}
                        <form action={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label htmlFor="shipping_partner_id" className="block text-sm font-bold text-gray-700 mb-2">
                                    Shipping Partner *
                                </label>
                                <select
                                    name="shipping_partner_id"
                                    id="shipping_partner_id"
                                    required
                                    className="block w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                                >
                                    <option value="">Select a shipping partner</option>
                                    {shippingPartners.map((partner) => (
                                        <option key={partner.id} value={partner.id}>
                                            {partner.name}
                                        </option>
                                    ))}
                                </select>
                                {shippingPartners.length === 0 && (
                                    <p className="mt-2 text-xs text-amber-600">
                                        No shipping partners configured. Add partners in Settings → Shipping Partners.
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="tracking_number" className="block text-sm font-bold text-gray-700 mb-2">
                                    Tracking Number *
                                </label>
                                <input
                                    type="text"
                                    name="tracking_number"
                                    id="tracking_number"
                                    placeholder="e.g., 1234567890"
                                    required
                                    className="block w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <FulfillButton disabled={shippingPartners.length === 0} />
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
