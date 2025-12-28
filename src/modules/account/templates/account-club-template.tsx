"use client"

import { ClubSettings, CustomerProfile } from "@lib/supabase/types"
import { Sparkles, Trophy, History } from "lucide-react"

type AccountClubTemplateProps = {
    customer: CustomerProfile
    clubSettings: ClubSettings
}

export default function AccountClubTemplate({ customer, clubSettings }: AccountClubTemplateProps) {
    const isMember = customer.is_club_member
    const discountPercentage = clubSettings.discount_percentage
    const joinDate = customer.club_member_since ? new Date(customer.club_member_since).toLocaleDateString() : 'N/A'
    const savings = customer.total_club_savings || 0

    return (
        <div className="w-full">
            <div className="mb-8 flex flex-col gap-y-4">
                <h1 className="text-2xl-semi">Club Membership</h1>
                <p className="text-base-regular text-gray-700">
                    View your membership status and savings.
                </p>
            </div>

            <div className="flex flex-col gap-y-8">
                {/* Status Card */}
                <div className={`p-8 rounded-2xl border ${isMember ? 'bg-gradient-to-br from-white to-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 shadow-sm ${isMember ? 'bg-emerald-100' : 'bg-gray-200'}`}>
                            {isMember ? <Trophy className="w-8 h-8 text-emerald-600" /> : <Sparkles className="w-8 h-8 text-gray-500" />}
                        </div>

                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-gray-900 mb-2">
                                {isMember ? "Active Club Member" : "Not a Member Yet"}
                            </h2>
                            <p className="text-gray-600">
                                {isMember
                                    ? `You are enjoying ${discountPercentage}% off on all orders!`
                                    : `Join the club by making a purchase over ${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(clubSettings.min_purchase_amount ?? 999)}.`}
                            </p>
                            {isMember && (
                                <p className="text-sm text-gray-500 mt-2">
                                    Member since: {joinDate}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Savings Stats (Member Only) */}
                {isMember && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-6 rounded-xl bg-white border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-emerald-50 rounded-lg">
                                    <History className="w-5 h-5 text-emerald-600" />
                                </div>
                                <span className="font-semibold text-gray-700">Total Savings</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">
                                {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(savings)}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                Saved across your lifetime club membership
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
