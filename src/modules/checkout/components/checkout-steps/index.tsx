"use client"

import { cn } from "@lib/util/cn"
import { Check } from "lucide-react"
import { useSearchParams } from "next/navigation"

const steps = [
    { key: "address", label: "Address" },
    { key: "delivery", label: "Delivery" },
    { key: "payment", label: "Payment" },
    { key: "review", label: "Review" },
] as const

type StepKey = typeof steps[number]["key"]

const CheckoutSteps = () => {
    const searchParams = useSearchParams()
    const currentStep = (searchParams.get("step") || "address") as StepKey

    const getCurrentIndex = () => {
        const index = steps.findIndex((s) => s.key === currentStep)
        return index >= 0 ? index : 0
    }

    const currentIndex = getCurrentIndex()

    return (
        <div className="w-full mb-8">
            <div className="flex items-center justify-between">
                {steps.map((step, index) => {
                    const isCompleted = index < currentIndex
                    const isCurrent = index === currentIndex
                    const isPending = index > currentIndex

                    return (
                        <div key={step.key} className="flex items-center flex-1">
                            {/* Step circle */}
                            <div className="flex flex-col items-center">
                                <div
                                    className={cn(
                                        "flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-all duration-300",
                                        {
                                            "bg-green-500 text-white": isCompleted,
                                            "bg-primary text-white ring-4 ring-primary/20": isCurrent,
                                            "bg-gray-200 text-gray-500": isPending,
                                        }
                                    )}
                                >
                                    {isCompleted ? (
                                        <Check className="w-5 h-5" />
                                    ) : (
                                        index + 1
                                    )}
                                </div>
                                <span
                                    className={cn(
                                        "mt-2 text-xs font-medium transition-colors",
                                        {
                                            "text-green-600": isCompleted,
                                            "text-primary": isCurrent,
                                            "text-gray-400": isPending,
                                        }
                                    )}
                                >
                                    {step.label}
                                </span>
                            </div>

                            {/* Connector line */}
                            {index < steps.length - 1 && (
                                <div
                                    className={cn(
                                        "flex-1 h-1 mx-2 rounded-full transition-colors duration-300",
                                        {
                                            "bg-green-500": isCompleted,
                                            "bg-gray-200": !isCompleted,
                                        }
                                    )}
                                />
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default CheckoutSteps
