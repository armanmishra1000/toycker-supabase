"use client"

/**
 * Order Status Card Component
 * Modern Tidio-inspired design with blue theme and clean visual hierarchy
 */

interface OrderStatusCardProps {
    order: {
        displayId: number
        status: string
        paymentStatus: string
        total: number
        createdAt: string
        trackingNumber?: string
        shippingPartner?: string
        itemCount: number
    }
}

// Format order status for display
function formatStatus(status: string): { text: string; color: string } {
    const statusMap: Record<string, { text: string; color: string }> = {
        pending: { text: "Pending", color: "bg-amber-100 text-amber-800" },
        order_placed: { text: "Order Placed", color: "bg-blue-100 text-blue-800" },
        accepted: { text: "Ready to Ship", color: "bg-indigo-100 text-indigo-800" },
        shipped: { text: "Shipped", color: "bg-sky-100 text-sky-800" },
        delivered: { text: "Delivered", color: "bg-emerald-100 text-emerald-800" },
        cancelled: { text: "Cancelled", color: "bg-rose-100 text-rose-800" },
        failed: { text: "Failed", color: "bg-rose-100 text-rose-800" }
    }
    return statusMap[status] || { text: status, color: "bg-slate-100 text-slate-800" }
}

// Get status icon
function getStatusIcon(status: string): string {
    const iconMap: Record<string, string> = {
        pending: "⏳",
        order_placed: "📋",
        accepted: "✅",
        shipped: "🚚",
        delivered: "🏠",
        cancelled: "❌",
        failed: "⚠️"
    }
    return iconMap[status] || "📦"
}

export default function OrderStatusCard({ order }: OrderStatusCardProps) {
    const statusInfo = formatStatus(order.status)
    const statusIcon = getStatusIcon(order.status)

    // Format date
    const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    })

    // Format currency
    const formattedTotal = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0
    }).format(order.total)

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-message-pop">
            {/* Header */}
            <div className="bg-blue-50/50 px-5 py-3.5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[11px] text-blue-600 font-bold uppercase tracking-wider mb-0.5">Order Details</span>
                        <span className="font-bold text-slate-800 text-base">
                            #{order.displayId}
                        </span>
                    </div>
                    <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-tight ${statusInfo.color}`}>
                        {statusIcon} {statusInfo.text}
                    </span>
                </div>
            </div>

            {/* Details */}
            <div className="p-5 space-y-4">
                {/* Order Info Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-slate-400 text-[11px] font-bold uppercase tracking-tight">Date</span>
                        <p className="font-semibold text-slate-700">{orderDate}</p>
                    </div>
                    <div>
                        <span className="text-slate-400 text-[11px] font-bold uppercase tracking-tight">Total Price</span>
                        <p className="font-bold text-blue-600">{formattedTotal}</p>
                    </div>
                    <div>
                        <span className="text-slate-400 text-[11px] font-bold uppercase tracking-tight">Quantity</span>
                        <p className="font-semibold text-slate-700">{order.itemCount} item{order.itemCount !== 1 ? 's' : ''}</p>
                    </div>
                    <div>
                        <span className="text-slate-400 text-[11px] font-bold uppercase tracking-tight">Payment</span>
                        <p className="font-semibold text-slate-700 capitalize">
                            {order.paymentStatus.replace(/_/g, " ")}
                        </p>
                    </div>
                </div>

                {/* Tracking Info (if shipped) */}
                {order.trackingNumber && (
                    <div className="bg-blue-600 rounded-xl p-4 shadow-sm text-white">
                        <p className="text-[11px] text-blue-100 font-bold uppercase tracking-wider mb-1">📦 Tracking Number</p>
                        <p className="text-[15px] font-mono font-bold tracking-widest">{order.trackingNumber}</p>
                        {order.shippingPartner && (
                            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-blue-500/50">
                                <span className="text-[11px] text-blue-100">Carrier:</span>
                                <span className="text-xs font-bold">{order.shippingPartner}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Status Progress */}
                <div className="pt-6 pb-2 px-1">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-tight">
                        <StatusDot active={true} label="Ordered" />
                        <StatusLine active={["accepted", "shipped", "delivered"].includes(order.status)} />
                        <StatusDot active={["accepted", "shipped", "delivered"].includes(order.status)} label="Ready" />
                        <StatusLine active={["shipped", "delivered"].includes(order.status)} />
                        <StatusDot active={["shipped", "delivered"].includes(order.status)} label="Shipped" />
                        <StatusLine active={order.status === "delivered"} />
                        <StatusDot active={order.status === "delivered"} label="Delivered" />
                    </div>
                </div>
            </div>
        </div>
    )
}

// Status dot component
function StatusDot({ active, label }: { active: boolean; label: string }) {
    return (
        <div className="flex flex-col items-center">
            <div className={`w-3.5 h-3.5 rounded-full ${active ? "bg-blue-600 shadow-sm ring-4 ring-blue-50" : "bg-slate-200"}`} />
            <span className={`mt-2 ${active ? "text-blue-600" : "text-slate-400"}`}>
                {label}
            </span>
        </div>
    )
}

// Status line component
function StatusLine({ active }: { active: boolean }) {
    return (
        <div className={`flex-1 h-1 mx-0.5 rounded-full ${active ? "bg-blue-600" : "bg-slate-100"}`} />
    )
}
