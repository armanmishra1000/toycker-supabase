"use client"

import { useEffect, useMemo, useState } from "react"
import { Order } from "@/lib/supabase/types"
import { Check, Package, Truck, Home, Clock } from "lucide-react"
import { RealtimeOrderManager } from "@modules/common/components/realtime-order-manager"

type OrderTrackingProps = {
    order: Order
}

const OrderTracking = ({ order: initialOrder }: OrderTrackingProps) => {
    const [order, setOrder] = useState(initialOrder)

    // Sync state when props change (from router.refresh() or parent)
    useEffect(() => {
        setOrder(initialOrder)
    }, [initialOrder])

    const statuses = useMemo(() => ([
        { key: "order_placed", label: "Ordered", icon: Clock },
        { key: "accepted", label: "Ready to Ship", icon: Package },
        { key: "shipped", label: "Shipped", icon: Truck },
        { key: "delivered", label: "Delivered", icon: Home },
    ]), [])

    const currentStatusIndex = statuses.findIndex((s) => s.key === order.status)
    const displayStatusIndex = currentStatusIndex === -1 && order.status === 'pending' ? 0 : currentStatusIndex
    const progressPercent = Math.max(0, displayStatusIndex) / (statuses.length - 1) * 100

    if (order.status === 'cancelled' || order.status === 'failed') {
        return null
    }

    return (
        <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.35)] p-6 sm:p-10 mb-8">
            <RealtimeOrderManager orderId={order.id} />
            <div className="flex flex-col gap-y-6">
                <div className="flex items-center justify-between gap-x-4">
                    <div className="flex flex-col gap-y-1">
                        <h3 className="text-xl font-black text-slate-900">Track Order</h3>
                        <p className="text-sm text-slate-500">Real-time updates on your delivery</p>
                    </div>
                    {order.tracking_number && (
                        <div className="bg-gradient-to-r from-sky-50 to-indigo-50 border border-blue-100 rounded-2xl px-4 py-2 flex flex-col items-end shadow-sm">
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest leading-none mb-1">Tracking Number</span>
                            <span className="text-sm font-black text-blue-700 font-mono uppercase tracking-tighter">{order.tracking_number}</span>
                        </div>
                    )}
                </div>

                {/* Tracking Bar */}
                <div className="relative mt-6">
                    {/* Base line */}
                    <div className="absolute top-6 left-0 w-full h-[6px] bg-slate-100 -translate-y-1/2 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 transition-all duration-700 ease-out"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>

                    {/* Steps */}
                    <div className="relative flex justify-between items-center w-full">
                        {statuses.map((status, index) => {
                            const Icon = status.icon
                            const isCompleted = index <= displayStatusIndex
                            const isCurrent = index === displayStatusIndex

                            return (
                                <div key={status.key} className="flex flex-col items-center gap-y-3 z-10 text-center">
                                    <div
                                        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border-4 shadow-sm ${isCompleted
                                            ? "bg-emerald-500 border-white text-white"
                                            : "bg-white border-slate-100 text-slate-300"
                                            } ${isCurrent ? "scale-110 shadow-emerald-200 ring-4 ring-emerald-50" : ""}`}
                                    >
                                        {isCompleted && index < currentStatusIndex ? (
                                            <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                                        ) : (
                                            <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${isCurrent ? "animate-pulse" : ""}`} />
                                        )}
                                    </div>
                                    <span className={`text-[10px] sm:text-xs font-black uppercase tracking-widest transition-colors ${isCompleted ? "text-emerald-600" : "text-slate-400"
                                        }`}>
                                        {status.label}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {(order.status === 'shipped' || order.status === 'delivered') && order.shipping_partner?.name && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-dotted border-slate-200 flex items-center gap-x-4">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                            <Truck className="w-6 h-6 text-slate-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Shipped via</p>
                            <p className="text-sm font-black text-slate-900">{order.shipping_partner.name}</p>
                        </div>
                        {order.tracking_number && (
                            <a
                                href={`https://www.google.com/search?q=${encodeURIComponent(order.shipping_partner.name + " tracking " + order.tracking_number)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-black text-blue-600 hover:text-blue-700 underline underline-offset-4"
                            >
                                TRACK PARCEL
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default OrderTracking
