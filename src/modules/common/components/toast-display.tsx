import { useEffect, useState } from "react"
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

const TOAST_DURATION = 8000

function ToastItem({ toast, onRemove }: { toast: any, onRemove: (_id: string) => void }) {
  const [timeLeft, setTimeLeft] = useState(TOAST_DURATION)
  const [isPaused, setIsPaused] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const style = TOAST_STYLES[toast.type as keyof typeof TOAST_STYLES] || TOAST_STYLES.info

  useEffect(() => {
    if (isPaused || isExiting) return

    const interval = 10
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const next = Math.max(0, prev - interval)
        if (next === 0) {
          setIsExiting(true)
          clearInterval(timer)
        }
        return next
      })
    }, interval)

    return () => clearInterval(timer)
  }, [isPaused, isExiting])

  useEffect(() => {
    if (isExiting) {
      const timer = setTimeout(() => onRemove(toast.id), 700)
      return () => clearTimeout(timer)
    }
  }, [isExiting, onRemove, toast.id])

  const progress = (timeLeft / TOAST_DURATION) * 100

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`
        pointer-events-auto relative overflow-hidden
        flex items-start gap-4 p-4 rounded-2xl border shadow-lg
        transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] transform
        ${isExiting ? "opacity-0 translate-x-12 scale-90 blur-sm" : "animate-in slide-in-from-right-12 fade-in"}
        ${style.bg} ${style.border}
      `}
    >
      {/* Progress Bar Container */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-black/5">
        <div
          className={`h-full transition-all duration-100 ease-linear ${style.accent}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Circular Icon Accent */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${style.accent}`}>
        {style.icon}
      </div>

      {/* Content */}
      <div className="flex-grow pt-0.5">
        <h4 className={`text-base font-bold leading-none mb-1.5 ${style.textColor}`}>
          {toast.title || style.title}
        </h4>
        <p className={`text-sm tracking-tight leading-snug font-medium ${style.subTextColor}`}>
          {toast.message}
        </p>
      </div>

      {/* Close Button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsExiting(true)
        }}
        className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Close toast"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  )
}

export default function ToastDisplay() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none max-w-md w-full sm:w-[400px]">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  )
}

