"use client"

import { ButtonHTMLAttributes, ReactNode } from "react"
import { Loader2, LucideIcon } from "lucide-react"
import { cn } from "@lib/util/cn"

type IconButtonVariant = "default" | "danger" | "success" | "warning"
type IconButtonSize = "sm" | "md" | "lg"

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
    icon: LucideIcon
    variant?: IconButtonVariant
    size?: IconButtonSize
    isLoading?: boolean
    tooltip?: string
}

const variantStyles: Record<IconButtonVariant, string> = {
    default: "text-gray-400 hover:bg-gray-100 hover:text-gray-600",
    danger: "text-gray-400 hover:bg-red-50 hover:text-red-600",
    success: "text-green-600 hover:bg-green-50",
    warning: "text-amber-600 hover:bg-amber-50",
}

const sizeStyles: Record<IconButtonSize, string> = {
    sm: "p-1",
    md: "p-1.5",
    lg: "p-2",
}

const iconSizeStyles: Record<IconButtonSize, string> = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
}

/**
 * IconButton - Reusable icon-only button with loading state
 * 
 * @example
 * ```tsx
 * <IconButton
 *   icon={Trash2}
 *   variant="danger"
 *   isLoading={isDeleting}
 *   tooltip="Delete item"
 *   onClick={handleDelete}
 * />
 * ```
 */
export function IconButton({
    icon: Icon,
    variant = "default",
    size = "md",
    isLoading = false,
    tooltip,
    className,
    disabled,
    ...props
}: IconButtonProps) {
    const isDisabled = disabled || isLoading

    return (
        <button
            disabled={isDisabled}
            title={tooltip}
            className={cn(
                "rounded transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "focus:outline-none focus:ring-2 focus:ring-offset-1",
                variantStyles[variant],
                sizeStyles[size],
                variant === "danger" && "focus:ring-red-500",
                variant === "success" && "focus:ring-green-500",
                className
            )}
            {...props}
        >
            {isLoading ? (
                <Loader2 className={cn("animate-spin", iconSizeStyles[size])} />
            ) : (
                <Icon className={iconSizeStyles[size]} />
            )}
        </button>
    )
}
