"use client"

import { Minus, Plus } from "lucide-react"
import { cn } from "@lib/util/cn"

type QuantitySelectorProps = {
    quantity: number
    onChange: (value: number) => void
    onIncrement?: () => void
    onDecrement?: () => void
    max?: number
    min?: number
    disabled?: boolean
    loading?: boolean
    className?: string
    size?: "small" | "default"
}

const QuantitySelector = ({
    quantity,
    onChange,
    onIncrement,
    onDecrement,
    max = 10,
    min = 1,
    disabled = false,
    loading = false,
    className,
    size = "default",
}: QuantitySelectorProps) => {
    const handleDecrement = () => {
        if (disabled || loading || quantity <= min) return
        if (onDecrement) {
            onDecrement()
        } else {
            onChange(Math.max(min, quantity - 1))
        }
    }

    const handleIncrement = () => {
        if (disabled || loading || quantity >= max) return
        if (onIncrement) {
            onIncrement()
        } else {
            onChange(Math.min(max, quantity + 1))
        }
    }

    return (
        <div
            className={cn(
                "flex items-center bg-slate-50 border border-slate-100 rounded-lg sm:rounded-xl overflow-hidden shadow-sm",
                {
                    "h-8 px-1": size === "small",
                    "h-10 px-1 sm:h-11 sm:px-1.5": size === "default",
                },
                className
            )}
        >
            <button
                type="button"
                onClick={handleDecrement}
                disabled={disabled || loading || quantity <= min}
                className={cn(
                    "flex items-center justify-center rounded-lg transition-all",
                    {
                        "w-7 h-7": size === "small",
                        "w-8 h-8 sm:w-9 sm:h-9 text-slate-600": size === "default",
                        "hover:bg-white hover:shadow-sm": !disabled && !loading && quantity > min,
                        "opacity-30 cursor-not-allowed": disabled || loading || quantity <= min,
                    }
                )}
                aria-label="Decrease quantity"
            >
                <Minus className={cn("", size === "small" ? "w-3 h-3" : "w-4 h-4")} strokeWidth={2.5} />
            </button>

            <div
                className={cn(
                    "flex items-center justify-center font-bold text-slate-900 select-none",
                    {
                        "min-w-[24px] text-xs": size === "small",
                        "min-w-[36px] sm:min-w-[44px] text-sm sm:text-base": size === "default",
                    }
                )}
            >
                {quantity}
            </div>

            <button
                type="button"
                onClick={handleIncrement}
                disabled={disabled || loading || quantity >= max}
                className={cn(
                    "flex items-center justify-center rounded-lg transition-all",
                    {
                        "w-7 h-7": size === "small",
                        "w-8 h-8 sm:w-9 sm:h-9 text-slate-600": size === "default",
                        "hover:bg-white hover:shadow-sm": !disabled && !loading && quantity < max,
                        "opacity-30 cursor-not-allowed": disabled || loading || quantity >= max,
                    }
                )}
                aria-label="Increase quantity"
            >
                <Plus className={cn("", size === "small" ? "w-3 h-3" : "w-4 h-4")} strokeWidth={2.5} />
            </button>
        </div>
    )
}

export default QuantitySelector
