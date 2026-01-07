import { Order } from "@/lib/supabase/types"
import { Text } from "@modules/common/components/text"

type OrderDetailsProps = {
  order: Order
  showStatus?: boolean
}

const OrderDetails = ({ order }: OrderDetailsProps) => {
  const isCOD =
    order.payment_method?.toLowerCase().includes("cod") ||
    order.payment_method?.toLowerCase().includes("cash") ||
    (order.metadata?.payment_method as string)?.toLowerCase() === "cod"

  const rewardsEarned = (order.metadata?.rewards_earned as number) || 0

  return (
    <div className="flex flex-col gap-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-y-1">
          <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
            Confirmed To
          </p>
          <Text className="text-lg font-bold text-slate-900">
            {order.customer_email || order.email}
          </Text>
          {order.shipping_address?.phone && (
            <Text className="text-slate-500 font-medium">
              {order.shipping_address.phone}
            </Text>
          )}
        </div>

        <div className="flex flex-col md:items-end gap-y-1">
          <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
            Payment Status
          </p>
          <div className="flex items-center gap-x-2">
            <span
              className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm ${isCOD
                  ? "bg-amber-100 text-amber-700 border border-amber-200"
                  : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                }`}
            >
              {isCOD ? "COD" : "Paid"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-6 items-center justify-between pb-6 border-b border-slate-100">
        <div className="flex flex-col gap-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Order Date
          </p>
          <Text className="font-bold text-slate-800">
            {new Date(order.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
        </div>
        <div className="flex flex-col md:items-end gap-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Order Number
          </p>
          <Text className="text-xl font-black text-blue-600 tracking-tight">
            #{order.display_id}
          </Text>
        </div>
      </div>

      {rewardsEarned > 0 && (
        <div className="group relative bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 overflow-hidden shadow-xl shadow-indigo-200 transition-all hover:scale-[1.01]">
          {/* Animated background stars or sparkles could go here */}
          <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-4 -translate-y-4">
            <span className="text-8xl">💎</span>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:rotate-12 transition-transform">
              🎁
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h4 className="text-white font-black text-xl mb-0.5">
                Premium Rewards Credited!
              </h4>
              <p className="text-indigo-100 font-medium">
                You earned <span className="text-white font-black text-2xl mx-1 animate-pulse">{rewardsEarned}</span> reward points from this purchase.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderDetails