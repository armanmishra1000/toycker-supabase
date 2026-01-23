"use client"

import { useState, useTransition } from "react"
import { acceptOrder, cancelOrder, markOrderAsDelivered } from "@/lib/data/admin"
import { cn } from "@lib/util/cn"
import { CheckIcon, HandThumbUpIcon, XMarkIcon } from "@heroicons/react/24/outline"
import Modal from "@modules/common/components/modal"
import { ProtectedAction } from "@/lib/permissions/components/protected-action"
import { PERMISSIONS } from "@/lib/permissions"

type ConfirmDialogProps = {
    open: boolean
    title: string
    description: string
    confirmLabel: string
    confirmTone?: "primary" | "danger"
    onConfirm: () => void
    onClose: () => void
    loading?: boolean
}

function ConfirmDialog({ open, title, description, confirmLabel, confirmTone = "primary", onConfirm, onClose, loading }: ConfirmDialogProps) {
    return (
        <Modal isOpen={open} close={onClose} size="small">
            <div className="space-y-5">
                <Modal.Title>
                    <span className="text-lg font-black text-slate-900">{title}</span>
                </Modal.Title>
                <Modal.Description>
                    <span className="text-center leading-relaxed text-slate-600 text-sm">{description}</span>
                </Modal.Description>
                <Modal.Footer>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        disabled={loading}
                    >
                        Close
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-bold text-white shadow-sm",
                            confirmTone === "danger"
                                ? "bg-red-600 hover:bg-red-700 disabled:bg-red-400"
                                : "bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400"
                        )}
                    >
                        {loading ? "Processing..." : confirmLabel}
                    </button>
                </Modal.Footer>
            </div>
        </Modal>
    )
}

export function AcceptOrderButton({ orderId }: { orderId: string }) {
    const [isPending, startTransition] = useTransition()
    const [open, setOpen] = useState(false)

    return (
        <ProtectedAction permission={PERMISSIONS.ORDERS_UPDATE} hideWhenDisabled>
            <button
                onClick={() => setOpen(true)}
                disabled={isPending}
                className={cn(
                    "px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 min-w-[130px]",
                    isPending && "cursor-not-allowed"
                )}
            >
                {isPending ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                    <HandThumbUpIcon className="h-4 w-4" />
                )}
                {isPending ? "Accepting..." : "Accept Order"}
            </button>

            <ConfirmDialog
                open={open}
                onClose={() => setOpen(false)}
                onConfirm={() => {
                    startTransition(async () => {
                        await acceptOrder(orderId)
                        setOpen(false)
                    })
                }}
                loading={isPending}
                title="Accept Order"
                description="Are you sure you want to accept this order?"
                confirmLabel="Accept"
            />
        </ProtectedAction>
    )
}

export function MarkAsDeliveredButton({ orderId }: { orderId: string }) {
    const [isPending, startTransition] = useTransition()
    const [open, setOpen] = useState(false)

    return (
        <ProtectedAction permission={PERMISSIONS.ORDERS_UPDATE} hideWhenDisabled>
            <button
                onClick={() => setOpen(true)}
                disabled={isPending}
                className={cn(
                    "px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 min-w-[150px]",
                    isPending && "cursor-not-allowed"
                )}
            >
                {isPending ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                    <CheckIcon className="h-4 w-4" strokeWidth={3} />
                )}
                {isPending ? "Updating..." : "Mark Delivered"}
            </button>

            <ConfirmDialog
                open={open}
                onClose={() => setOpen(false)}
                onConfirm={() => {
                    startTransition(async () => {
                        await markOrderAsDelivered(orderId)
                        setOpen(false)
                    })
                }}
                loading={isPending}
                title="Mark as Delivered"
                description="Confirm this order has been delivered to the customer."
                confirmLabel="Mark Delivered"
            />
        </ProtectedAction>
    )
}

export function CancelOrderButton({ orderId }: { orderId: string }) {
    const [isPending, startTransition] = useTransition()
    const [open, setOpen] = useState(false)

    return (
        <ProtectedAction permission={PERMISSIONS.ORDERS_UPDATE} hideWhenDisabled>
            <button
                onClick={() => setOpen(true)}
                disabled={isPending}
                className={cn(
                    "px-4 py-2 bg-white text-red-600 border border-red-200 text-sm font-bold rounded-lg hover:bg-red-50 transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 min-w-[130px]",
                    isPending && "cursor-not-allowed"
                )}
            >
                {isPending ? (
                    <div className="h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                    <XMarkIcon className="h-4 w-4" />
                )}
                {isPending ? "Cancelling..." : "Cancel Order"}
            </button>

            <ConfirmDialog
                open={open}
                onClose={() => setOpen(false)}
                onConfirm={() => {
                    startTransition(async () => {
                        await cancelOrder(orderId)
                        setOpen(false)
                    })
                }}
                loading={isPending}
                title="Cancel Order"
                description="Are you sure you want to cancel this order?"
                confirmLabel="Cancel Order"
                confirmTone="danger"
            />
        </ProtectedAction>
    )
}
