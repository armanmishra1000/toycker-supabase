"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { cancelUserOrder } from "@/lib/data/orders"
import Modal from "@modules/common/components/modal"

type Props = {
  orderId: string
}

export function CancelOrderButton({ orderId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const onConfirm = () => {
    startTransition(async () => {
      try {
        await cancelUserOrder(orderId)
        setOpen(false)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to cancel order.")
      }
    })
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
      <button
        onClick={() => setOpen(true)}
        disabled={isPending}
        className="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-bold bg-white hover:bg-red-50 shadow-sm disabled:opacity-60"
      >
        Cancel Order
      </button>

      <Modal isOpen={open} close={() => setOpen(false)} size="small">
        <div className="space-y-5">
          <Modal.Title>
            <span className="text-lg font-black text-slate-900">Cancel Order</span>
          </Modal.Title>
          <Modal.Description>
            <span className="leading-relaxed text-slate-600 text-sm">
              Are you sure you want to cancel this order? It can only be cancelled before it is accepted.
            </span>
          </Modal.Description>
          <Modal.Footer>
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              disabled={isPending}
            >
              Close
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className="px-4 py-2 rounded-lg text-sm font-bold text-white shadow-sm bg-red-600 hover:bg-red-700 disabled:bg-red-400"
            >
              {isPending ? "Cancelling..." : "Cancel Order"}
            </button>
          </Modal.Footer>
        </div>
      </Modal>

      <Modal isOpen={!!error} close={() => setError(null)} size="small">
        <div className="space-y-5">
          <Modal.Title>
            <span className="text-lg font-black text-slate-900">Cannot Cancel</span>
          </Modal.Title>
          <Modal.Description>
            <span className="text-center leading-relaxed text-slate-600 text-sm">{error}</span>
          </Modal.Description>
          <Modal.Footer>
            <button
              onClick={() => setError(null)}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </Modal.Footer>
        </div>
      </Modal>
    </div>
  )
}

export default CancelOrderButton
