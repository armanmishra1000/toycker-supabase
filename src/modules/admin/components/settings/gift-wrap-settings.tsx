"use client"

import { useState, useTransition } from "react"
import AdminCard from "@modules/admin/components/admin-card"
import { GlobalSettings } from "@/lib/supabase/types"
import { updateGlobalSettings } from "@/lib/data/settings"
import { CheckIcon, GiftIcon } from "@heroicons/react/24/outline"
import { useOptionalToast } from "@modules/common/context/toast-context"

export default function GiftWrapSettings({ initialSettings }: { initialSettings: GlobalSettings }) {
    const [settings, setSettings] = useState(initialSettings)
    const [isPending, startTransition] = useTransition()
    const toast = useOptionalToast()

    const handleSave = async () => {
        startTransition(async () => {
            try {
                await updateGlobalSettings(settings)
                toast?.showToast("Settings updated successfully", "success")
            } catch (err) {
                toast?.showToast("Failed to update settings", "error")
            }
        })
    }

    return (
        <AdminCard title="Add-ons & Gift Wrap">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-pink-50 flex items-center justify-center">
                            <GiftIcon className="h-6 w-6 text-pink-500" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900">Gift Wrap Option</p>
                            <p className="text-xs text-gray-500">Allow customers to add gift wrapping to their items.</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.is_gift_wrap_enabled}
                            onChange={(e) => setSettings({ ...settings, is_gift_wrap_enabled: e.target.checked })}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                    </label>
                </div>

                {settings.is_gift_wrap_enabled && (
                    <div className="pt-4 border-t border-gray-100">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Gift Wrap Fee (₹)</label>
                        <div className="relative max-w-[200px]">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">₹</span>
                            </div>
                            <input
                                type="number"
                                value={settings.gift_wrap_fee}
                                onChange={(e) => setSettings({ ...settings, gift_wrap_fee: Number(e.target.value) })}
                                className="pl-7 block w-full rounded-xl border-gray-200 focus:border-pink-500 focus:ring-pink-500 sm:text-sm shadow-sm transition-all"
                                placeholder="0"
                            />
                        </div>
                    </div>
                )}

                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleSave}
                        disabled={isPending}
                        className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-all disabled:opacity-50"
                    >
                        {isPending ? "Saving..." : (
                            <>
                                <CheckIcon className="h-4 w-4" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </AdminCard>
    )
}
