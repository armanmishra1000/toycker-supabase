"use client"

import { useToast } from "@modules/common/context/toast-context"
import { Check, X, AlertCircle } from "lucide-react"

export default function ToastDisplay() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg min-w-[300px] animate-in slide-in-from-right
            ${
              toast.type === "success"
                ? "bg-green-50 text-green-900 border border-green-200"
                : toast.type === "error"
                  ? "bg-red-50 text-red-900 border border-red-200"
                  : "bg-blue-50 text-blue-900 border border-blue-200"
            }
          `}
        >
          {toast.type === "success" && <Check className="w-5 h-5" />}
          {toast.type === "error" && <X className="w-5 h-5" />}
          {toast.type === "info" && <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-auto hover:opacity-70"
            aria-label="Close toast"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
