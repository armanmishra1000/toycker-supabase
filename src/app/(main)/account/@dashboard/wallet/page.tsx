import { getRewardWallet, getRewardTransactions } from "@lib/data/rewards"
import { Wallet, ArrowUpCircle, ArrowDownCircle, Info, ExternalLink } from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default async function WalletPage() {
    const wallet = await getRewardWallet()
    const transactions = await getRewardTransactions()

    // Non-club members shouldn't see this page
    if (!wallet) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Wallet className="w-12 h-12 text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Rewards Wallet</h2>
                <p className="text-gray-500 text-center max-w-md">
                    Join the Toycker Club to unlock rewards! Make a qualifying purchase to become a member and start earning points.
                </p>
            </div>
        )
    }

    return (
        <div className="w-full">
            <h1 className="text-2xl font-bold mb-6">Rewards Wallet</h1>


            {/* Balance Card */}
            <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white rounded-xl p-6 mb-6">
                <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-5 h-5" />
                    <span className="text-purple-200 text-sm">Available Balance</span>
                </div>
                <div className="text-4xl font-bold mb-2">
                    {wallet.balance.toLocaleString()} points
                </div>
                <div className="flex items-center gap-1 text-purple-200 text-sm">
                    <Info className="w-4 h-4" />
                    <span>1 point = ₹1 discount at checkout</span>
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-800 mb-1">How it works</h3>
                <ul className="text-blue-700 text-sm space-y-1">
                    <li>• Earn points on every purchase as a Club member</li>
                    <li>• Use points at checkout to get instant discounts</li>
                    <li>• Points never expire</li>
                </ul>
            </div>

            {/* Transaction History */}
            <div>
                <h2 className="text-lg font-semibold mb-4">Transaction History</h2>
                {transactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p>No transactions yet.</p>
                        <p className="text-sm">Make a purchase to earn your first rewards!</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                        <div className="divide-y divide-gray-100">
                            {transactions.map((tx) => (
                                <div
                                    key={tx.id}
                                    className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-full ${tx.amount > 0 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                                            }`}>
                                            {tx.amount > 0 ? (
                                                <ArrowUpCircle className="w-6 h-6" />
                                            ) : (
                                                <ArrowDownCircle className="w-6 h-6" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-900">
                                                    {tx.description}
                                                </span>
                                                {tx.order_id && tx.orders?.display_id && (
                                                    <LocalizedClientLink
                                                        href={`/account/orders`}
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 hover:text-primary rounded text-xs font-medium transition-colors"
                                                    >
                                                        #{tx.orders.display_id}
                                                        <ExternalLink className="w-3 h-3" />
                                                    </LocalizedClientLink>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                                                {new Date(tx.created_at).toLocaleDateString("en-IN", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit"
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`text-lg font-black ${tx.amount > 0 ? "text-green-600" : "text-red-600"
                                        }`}>
                                        {tx.amount > 0 ? "+" : ""}{tx.amount}
                                        <span className="text-[10px] uppercase ml-1 opacity-70">pts</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
