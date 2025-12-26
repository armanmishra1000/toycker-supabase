import { useEffect } from "react"

interface UseBodyScrollLockOptions {
  isLocked: boolean
}

export const useBodyScrollLock = ({ isLocked }: UseBodyScrollLockOptions): void => {
  useEffect(() => {
    if (!isLocked) return

    // Calculate scrollbar width to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

    // Store original values
    const originalOverflow = document.body.style.overflow
    const originalPaddingRight = document.body.style.paddingRight

    // Lock scroll
    document.body.style.overflow = "hidden"
    document.body.style.paddingRight = `${scrollbarWidth}px`
    document.body.classList.add("modal-open")

    // Cleanup - restore everything
    return () => {
      document.body.style.overflow = originalOverflow
      document.body.style.paddingRight = originalPaddingRight
      document.body.classList.remove("modal-open")
    }
  }, [isLocked])
}
