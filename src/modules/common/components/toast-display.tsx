"use client"

import { useToast } from "@modules/common/context/toast-context"
import { Check, X, Lightbulb, AlertTriangle } from "lucide-react"

const TOAST_STYLES = {
  success: {
    bg: "bg-[#F4F9F4]",
    border: "border-[#D1EAD1]",
    accent: "bg-[#4ADE80]",
    icon: <Check className="w-4 h-4 text-white" />,
    title: "Congratulations!",
    textColor: "text-[#2D4A2D]",
    subTextColor: "text-[#4B634B]"
  },
  error: {
    bg: "bg-[#FEF2F2]",
    border: "border-[#FEE2E2]",
    accent: "bg-[#F87171]",
    icon: <X className="w-4 h-4 text-white" />,
    title: "Something went wrong!",
    textColor: "text-[#991B1B]",
    subTextColor: "text-[#B91C1C]"
  },
  info: {
    bg: "bg-[#EFF6FF]",
    border: "border-[#DBEAFE]",
    accent: "bg-[#3B82F6]",
    icon: <Lightbulb className="w-4 h-4 text-white" />,
    title: "Did you know?",
    textColor: "text-[#1E40AF]",
    subTextColor: "text-[#3B82F6]"
  },
  warning: {
    bg: "bg-[#FFFBEB]",
    border: "border-[#FEF3C7]",
    accent: "bg-[#FBBF24]",
    icon: <AlertTriangle className="w-4 h-4 text-white" />,
    title: "Warning!",
    textColor: "text-[#92400E]",
    subTextColor: "text-[#D97706]"
  }
}

export default function ToastDisplay() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none max-w-md w-full sm:w-[400px]">
      {toasts.map((toast) => {
        const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info

        return (
          <div
            key={toast.id}
            className={`
              pointer-events-auto
              flex items-start gap-4 p-4 rounded-2xl border shadow-sm
              animate-in slide-in-from-right fade-in duration-300
              ${style.bg} ${style.border}
            `}
          >
            {/* Circular Icon Accent */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${style.accent}`}>
              {style.icon}
            </div>

            {/* Content */}
            <div className="flex-grow pt-0.5">
              <h4 className={`text-base font-bold leading-none mb-1 ${style.textColor}`}>
                {toast.title || style.title}
              </h4>
              <p className={`text-sm tracking-tight leading-snug ${style.subTextColor}`}>
                {toast.message}
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close toast"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

