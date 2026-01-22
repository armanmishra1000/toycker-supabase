"use client"

import { useState, useTransition } from "react"
import { markOrderAsPaid } from "@/lib/data/admin"
import { cn } from "@lib/util/cn"
import Modal from "@modules/common/components/modal"

export function MarkAsPaidButton({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  return (
    <>
      <button
        onClick={() => {
          startTransition(async () => {
            try {
              await markOrderAsPaid(orderId)
            } catch (error) {
              console.error(error)
              setErrorMessage(error instanceof Error ? error.message : "Failed to mark order as paid.")
            }
          })
        }}
        disabled={isPending}
        className={cn(
          "px-4 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 min-w-[120px]",
          isPending && "cursor-not-allowed"
        )}
      >
        {isPending && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
        {isPending ? "Updating..." : "Mark as Paid"}
      </button>

      <Modal isOpen={!!errorMessage} close={() => setErrorMessage(null)} size="small">
        <div className="space-y-5">
          <Modal.Title>
            <span className="text-lg font-black text-slate-900">Error</span>
          </Modal.Title>
          <Modal.Description>
            <span className="text-center leading-relaxed text-slate-600 text-sm">{errorMessage}</span>
          </Modal.Description>
          <Modal.Footer>
            <button
              onClick={() => setErrorMessage(null)}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </Modal.Footer>
        </div>
      </Modal>
    </>
  )
}
