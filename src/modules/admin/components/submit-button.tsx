"use client"

import { useFormStatus } from "react-dom"
import { ButtonHTMLAttributes } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@lib/util/cn"

interface SubmitButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
    children: React.ReactNode
    loadingText?: string
    variant?: "primary" | "secondary" | "danger"
}

const variantStyles = {
    primary: "bg-black text-white hover:bg-gray-800",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    danger: "bg-red-600 text-white hover:bg-red-700",
}

/**
 * SubmitButton - For use with server actions and forms
 * Uses useFormStatus to show loading state automatically
 * 
 * @example
 * ```tsx
 * <form action={serverAction}>
 *   <SubmitButton loadingText="Saving...">
 *     Save Changes
 *   </SubmitButton>
 * </form>
 * ```
 */
export function SubmitButton({
    children,
    loadingText,
    className,
    variant = "primary",
    ...props
}: SubmitButtonProps) {
    const { pending } = useFormStatus()

    return (
        <button
            type="submit"
            disabled={pending}
            className={cn(
                "px-4 py-2 text-sm font-bold rounded-lg transition-all inline-flex items-center justify-center gap-2 min-w-[120px]",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                variantStyles[variant],
                className
            )}
            {...props}
        >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {pending ? (loadingText || children) : children}
        </button>
    )
}
