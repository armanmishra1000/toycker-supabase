"use client"

import { ButtonHTMLAttributes, ReactNode } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@lib/util/cn"

type ActionButtonVariant = "primary" | "secondary" | "danger" | "success"
type ActionButtonSize = "sm" | "md" | "lg"

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ActionButtonVariant
    size?: ActionButtonSize
    isLoading?: boolean
    loadingText?: string
    icon?: ReactNode
    children: ReactNode
}

const variantStyles: Record<ActionButtonVariant, string> = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
    success: "bg-green-600 text-white hover:bg-green-700 shadow-sm",
}

const sizeStyles: Record<ActionButtonSize, string> = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
}

/**
 * ActionButton - Reusable button component with loading state
 * 
 * @example
 * ```tsx
 * <ActionButton
 *   variant="primary"
 *   isLoading={isPending}
 *   loadingText="Saving..."
 *   onClick={handleSave}
 * >
 *   Save Changes
 * </ActionButton>
 * ```
 */
export function ActionButton({
    variant = "primary",
    size = "md",
    isLoading = false,
    loadingText,
    icon,
    children,
    className,
    disabled,
    ...props
}: ActionButtonProps) {
    const isDisabled = disabled || isLoading

    return (
        <button
            disabled={isDisabled}
            className={cn(
                "inline-flex items-center justify-center gap-2 font-bold rounded-lg transition-all",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "focus:outline-none focus:ring-2 focus:ring-offset-2",
                variantStyles[variant],
                sizeStyles[size],
                variant === "primary" && "focus:ring-indigo-500",
                variant === "danger" && "focus:ring-red-500",
                variant === "success" && "focus:ring-green-500",
                className
            )}
            {...props}
        >
            {isLoading ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{loadingText || children}</span>
                </>
            ) : (
                <>
                    {icon && <span className="flex-shrink-0">{icon}</span>}
                    <span>{children}</span>
                </>
            )}
        </button>
    )
}
