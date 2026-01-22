"use client"

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react"

type ToastType = "success" | "error" | "info" | "warning"

type Toast = {
  id: string
  title?: string
  message: string
  type: ToastType
}

type ToastContextValue = {
  toasts: Toast[]
  showToast: (_message: string, _type: ToastType, _title?: string) => void
  removeToast: (_id: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback((message: string, type: ToastType, title?: string) => {
    const id = Math.random().toString(36).substring(7)
    setToasts((prev) => [...prev, { id, title, message, type }])
  }, [])

  const value = useMemo(
    () => ({ toasts, showToast, removeToast }),
    [toasts, showToast, removeToast]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) throw new Error("useToast must be used within ToastProvider")
  return context
}

export const useOptionalToast = () => useContext(ToastContext)
