"use client"

import { useInView } from "react-intersection-observer"
import { ReactNode } from "react"
import { cn } from "@lib/util/cn"

interface LazyLoadSectionProps {
    children: ReactNode
    className?: string
    minHeight?: string | number
    threshold?: number
    rootMargin?: string
}

const LazyLoadSection = ({
    children,
    className,
    minHeight = "200px",
    threshold = 0.1,
    rootMargin = "200px 0px", // Trigger loading 200px before the element comes into view
}: LazyLoadSectionProps) => {
    const { ref, inView } = useInView({
        triggerOnce: true, // Only trigger this once
        threshold: threshold,
        rootMargin: rootMargin,
    })

    return (
        <div
            ref={ref}
            className={cn("transition-opacity duration-700", className, {
                "opacity-0": !inView,
                "opacity-100": inView,
            })}
            style={{ minHeight: !inView ? minHeight : undefined }}
        >
            {inView ? children : null}
        </div>
    )
}

export default LazyLoadSection
