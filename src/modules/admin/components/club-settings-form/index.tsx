"use client"

import { ClubSettings } from "@lib/supabase/types"
import { updateClubSettings } from "@lib/data/club"
import { useState } from "react"
import { Button } from "@modules/common/components/button"
import Input from "@modules/common/components/input"

export default function ClubSettingsForm({ settings }: { settings: ClubSettings }) {
    const [minPurchase, setMinPurchase] = useState(settings.min_purchase_amount)
    const [discount, setDiscount] = useState(settings.discount_percentage)
    const [isActive, setIsActive] = useState(settings.is_active)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setMessage(null)

        try {
            await updateClubSettings({
                min_purchase_amount: Number(minPurchase),
                discount_percentage: Number(discount),
                is_active: isActive
            })
            setMessage({ text: "Settings updated successfully", type: "success" })
        } catch (error) {
            setMessage({ text: "Failed to update settings", type: "error" })
        } finally {
            setSaving(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-6">

            {message && (
                <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Club Status
                </label>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setIsActive(!isActive)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${isActive ? 'bg-emerald-600' : 'bg-gray-200'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                    <span className="text-sm text-gray-500">
                        {isActive ? 'Active' : 'Inactive'}
                    </span>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Purchase Amount (INR)
                </label>
                <input
                    type="number"
                    value={minPurchase}
                    onChange={(e) => setMinPurchase(Number(e.target.value))}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                />
                <p className="mt-1 text-xs text-gray-500">
                    The amount a user needs to spend in a single order to qualify for membership.
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Percentage (%)
                </label>
                <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                />
                <p className="mt-1 text-xs text-gray-500">
                    The percentage discount club members receive on all products.
                </p>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
                <Button
                    type="submit"
                    disabled={saving}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                    {saving ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </form>
    )
}
