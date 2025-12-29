"use client"

import { useState } from "react"
import { Coins, Gift, Loader2 } from "lucide-react"
import { Cart } from "@/lib/supabase/types"
import { setRewardsToApply, clearRewardsFromCart } from "@lib/data/rewards"
import { convertToLocale } from "@lib/util/money"

interface RewardsRedemptionProps {
    cart: Cart
}

export default function RewardsRedemption({ cart }: RewardsRedemptionProps) {
    const [pointsToUse, setPointsToUse] = useState(cart.rewards_to_apply || 0)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const availablePoints = cart.available_rewards || 0
    const currentlyApplied = cart.rewards_to_apply || 0
    const maxUsable = Math.min(availablePoints, cart.item_subtotal || 0)

    // Don't show if not a club member or no points
    if (!cart.is_club_member || availablePoints === 0) {
        return null
    }

    const handleApply = async () => {
        if (pointsToUse < 0 || pointsToUse > maxUsable) {
            setError(`Enter between 0 and ${maxUsable} points`)
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            if (pointsToUse > 0) {
                await setRewardsToApply(cart.id, pointsToUse)
            } else {
                await clearRewardsFromCart(cart.id)
            }
            // Page will refresh automatically due to revalidateTag
        } catch (err) {
            setError("Failed to apply rewards. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClear = async () => {
        setIsSubmitting(true)
        setError(null)
        try {
            await clearRewardsFromCart(cart.id)
            setPointsToUse(0)
        } catch (err) {
            setError("Failed to remove rewards. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
                <Gift className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-purple-800">Use Reward Points</h3>
            </div>

            <div className="flex items-center gap-2 mb-3 text-purple-700 text-sm">
                <Coins className="w-4 h-4" />
                <span>Available: <strong>{availablePoints.toLocaleString()} points</strong></span>
                <span className="text-purple-500">(= {convertToLocale({ amount: availablePoints, currency_code: "INR" })})</span>
            </div>

            {currentlyApplied > 0 ? (
                <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-purple-200">
                    <div>
                        <span className="text-green-700 font-semibold">
                            -{convertToLocale({ amount: currentlyApplied, currency_code: "INR" })} applied
                        </span>
                        <span className="text-gray-500 text-sm ml-2">({currentlyApplied} points)</span>
                    </div>
                    <button
                        onClick={handleClear}
                        disabled={isSubmitting}
                        className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Remove"}
                    </button>
                </div>
            ) : (
                <div className="flex gap-2">
                    <input
                        type="number"
                        min="0"
                        max={maxUsable}
                        value={pointsToUse}
                        onChange={(e) => setPointsToUse(Math.min(maxUsable, Math.max(0, parseInt(e.target.value) || 0)))}
                        className="flex-1 px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Enter points to use"
                        disabled={isSubmitting}
                    />
                    <button
                        onClick={handleApply}
                        disabled={isSubmitting || pointsToUse <= 0}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                    </button>
                </div>
            )}

            {error && (
                <p className="text-red-600 text-sm mt-2">{error}</p>
            )}

            <p className="text-xs text-purple-600 mt-2">
                Max usable: {maxUsable} points (≤ subtotal)
            </p>
        </div>
    )
}
