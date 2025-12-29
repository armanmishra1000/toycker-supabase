import { getRewardWallet, getRewardTransactions } from "@lib/data/rewards"
import { Wallet, ArrowUpCircle, ArrowDownCircle, Info } from "lucide-react"

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
                    <div className="space-y-3">
                        {transactions.map((tx) => (
                            <div
                                key={tx.id}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    {tx.type === "earned" ? (
                                        <ArrowUpCircle className="w-8 h-8 text-green-500" />
                                    ) : (
                                        <ArrowDownCircle className="w-8 h-8 text-red-500" />
                                    )}
                                    <div>
                                        <div className="font-medium text-gray-800">{tx.description}</div>
                                        <div className="text-sm text-gray-500">
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
                                <div className={`text-lg font-bold ${tx.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                                    {tx.amount > 0 ? "+" : ""}{tx.amount} pts
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
