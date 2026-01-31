"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { cn } from "@lib/util/cn"

interface AdminTableWrapperProps {
    children: React.ReactNode
    className?: string
}

/**
 * AdminTableWrapper - Enhanced table container with improved scrolling UX
 * 
 * Features:
 * - Custom sticky horizontal scrollbar fixed at bottom of viewport
 * - Scroll shadow indicators on left/right edges
 * - Shift + Mouse wheel for horizontal scrolling
 * - Click & drag to scroll
 * - Bidirectional scroll sync between table and sticky scrollbar
 * - Direct thumb dragging with smooth animations
 */
export function AdminTableWrapper({ children, className }: AdminTableWrapperProps) {
    const tableContainerRef = useRef<HTMLDivElement>(null)
    const stickyScrollbarRef = useRef<HTMLDivElement>(null)
    const stickyScrollbarThumbRef = useRef<HTMLDivElement>(null)
    const [showLeftShadow, setShowLeftShadow] = useState(false)
    const [showRightShadow, setShowRightShadow] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [isThumbDragging, setIsThumbDragging] = useState(false)
    const [startX, setStartX] = useState(0)
    const [scrollLeft, setScrollLeft] = useState(0)
    const [thumbStartX, setThumbStartX] = useState(0)
    const [showStickyScrollbar, setShowStickyScrollbar] = useState(false)
    const [stickyScrollbarWidth, setStickyScrollbarWidth] = useState(0)
    const [stickyScrollbarLeft, setStickyScrollbarLeft] = useState(0)
    const [thumbWidth, setThumbWidth] = useState(0)

    // Update scroll shadows and sticky scrollbar based on scroll position
    const updateScrollShadows = useCallback(() => {
        const container = tableContainerRef.current
        if (!container) return

        const { scrollLeft, scrollWidth, clientWidth } = container

        setShowLeftShadow(scrollLeft > 0)
        setShowRightShadow(scrollLeft < scrollWidth - clientWidth - 1)

        // Update sticky scrollbar thumb position (only if not dragging thumb)
        if (stickyScrollbarThumbRef.current && scrollWidth > clientWidth && !isThumbDragging) {
            const scrollPercentage = scrollLeft / (scrollWidth - clientWidth)
            const maxThumbPosition = stickyScrollbarWidth - thumbWidth
            const thumbPosition = scrollPercentage * maxThumbPosition
            stickyScrollbarThumbRef.current.style.transform = `translateX(${thumbPosition}px)`
        }
    }, [stickyScrollbarWidth, thumbWidth, isThumbDragging])

    // Update sticky scrollbar visibility and dimensions
    const updateStickyScrollbar = useCallback(() => {
        const container = tableContainerRef.current
        if (!container) return

        const { scrollWidth, clientWidth } = container
        const isScrollable = scrollWidth > clientWidth

        // Check if table is in viewport
        const rect = container.getBoundingClientRect()
        const isInViewport = rect.top < window.innerHeight && rect.bottom > 0

        setShowStickyScrollbar(isScrollable && isInViewport)

        if (isScrollable) {
            // Calculate thumb width based on visible ratio
            const visibleRatio = clientWidth / scrollWidth
            const calculatedThumbWidth = Math.max(clientWidth * visibleRatio, 50) // Min 50px
            setThumbWidth(calculatedThumbWidth)
            setStickyScrollbarWidth(clientWidth)
            setStickyScrollbarLeft(rect.left) // Store the left offset to align with table
        }
    }, [])

    // Handle sticky scrollbar track click
    const handleStickyScrollbarClick = useCallback((e: React.MouseEvent) => {
        const container = tableContainerRef.current
        const scrollbarThumb = stickyScrollbarThumbRef.current
        if (!container || !scrollbarThumb) return

        const scrollbarRect = e.currentTarget.getBoundingClientRect()
        const clickX = e.clientX - scrollbarRect.left
        const thumbRect = scrollbarThumb.getBoundingClientRect()
        const thumbCenter = thumbRect.left - scrollbarRect.left + thumbRect.width / 2

        // If clicking on the track (not the thumb), scroll to that position
        if (Math.abs(clickX - thumbCenter) > thumbRect.width / 2) {
            const { scrollWidth, clientWidth } = container
            const maxScrollLeft = scrollWidth - clientWidth
            const scrollPercentage = (clickX - thumbWidth / 2) / (stickyScrollbarWidth - thumbWidth)
            container.scrollLeft = Math.max(0, Math.min(maxScrollLeft, scrollPercentage * maxScrollLeft))
        }
    }, [stickyScrollbarWidth, thumbWidth])

    // Thumb drag handlers
    const handleThumbMouseDown = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        setIsThumbDragging(true)
        setThumbStartX(e.clientX)

        const thumb = stickyScrollbarThumbRef.current
        if (thumb) {
            const transform = thumb.style.transform
            const currentX = transform ? parseFloat(transform.replace(/[^0-9.-]/g, '')) || 0 : 0
            setStartX(currentX)
        }
    }, [])

    const handleThumbMouseMove = useCallback((e: MouseEvent) => {
        if (!isThumbDragging) return

        const container = tableContainerRef.current
        const thumb = stickyScrollbarThumbRef.current
        if (!container || !thumb) return

        const deltaX = e.clientX - thumbStartX
        const newThumbX = Math.max(0, Math.min(stickyScrollbarWidth - thumbWidth, startX + deltaX))

        // Update thumb position
        thumb.style.transform = `translateX(${newThumbX}px)`

        // Calculate and update container scroll
        const { scrollWidth, clientWidth } = container
        const maxScrollLeft = scrollWidth - clientWidth
        const scrollPercentage = newThumbX / (stickyScrollbarWidth - thumbWidth)
        container.scrollLeft = scrollPercentage * maxScrollLeft
    }, [isThumbDragging, thumbStartX, startX, stickyScrollbarWidth, thumbWidth])

    const handleThumbMouseUp = useCallback(() => {
        setIsThumbDragging(false)
    }, [])

    // Handle horizontal scrolling with Shift + Mouse Wheel
    const handleWheel = useCallback((e: WheelEvent) => {
        if (!e.shiftKey) return

        const container = tableContainerRef.current
        if (!container) return

        e.preventDefault()
        container.scrollLeft += e.deltaY
        updateScrollShadows()
    }, [updateScrollShadows])

    // Drag to scroll handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        const container = tableContainerRef.current
        if (!container) return

        // Only start drag if clicking on the container itself, not on interactive elements
        const target = e.target as HTMLElement
        if (target.closest('a, button, input, select, textarea')) {
            return
        }

        setIsDragging(true)
        setStartX(e.pageX - container.offsetLeft)
        setScrollLeft(container.scrollLeft)
        container.style.cursor = 'grabbing'
        container.style.userSelect = 'none'
    }, [])

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging) return

        const container = tableContainerRef.current
        if (!container) return

        e.preventDefault()
        const x = e.pageX - container.offsetLeft
        const walk = (x - startX) * 1.5
        container.scrollLeft = scrollLeft - walk
        updateScrollShadows()
    }, [isDragging, startX, scrollLeft, updateScrollShadows])

    const handleMouseUpOrLeave = useCallback(() => {
        if (!isDragging) return

        setIsDragging(false)
        const container = tableContainerRef.current
        if (!container) return

        container.style.cursor = 'grab'
        container.style.userSelect = 'auto'
    }, [isDragging])

    // Set up event listeners
    useEffect(() => {
        const container = tableContainerRef.current
        if (!container) return

        // Initial checks
        updateScrollShadows()
        updateStickyScrollbar()

        // Add wheel event listener
        container.addEventListener('wheel', handleWheel, { passive: false })

        // Add resize observer
        const resizeObserver = new ResizeObserver(() => {
            updateScrollShadows()
            updateStickyScrollbar()
        })
        resizeObserver.observe(container)

        // Add scroll listener for sticky scrollbar visibility and position
        const handleScroll = () => {
            // Update visibility and position immediately on scroll
            updateStickyScrollbar()
        }

        // Use requestAnimationFrame for smooth updates
        let rafId: number
        const handleScrollRaf = () => {
            if (rafId) {
                cancelAnimationFrame(rafId)
            }
            rafId = requestAnimationFrame(handleScroll)
        }

        window.addEventListener('scroll', handleScrollRaf, { passive: true })
        window.addEventListener('resize', handleScrollRaf, { passive: true })

        return () => {
            container.removeEventListener('wheel', handleWheel)
            resizeObserver.disconnect()
            window.removeEventListener('scroll', handleScrollRaf)
            window.removeEventListener('resize', handleScrollRaf)
            if (rafId) {
                cancelAnimationFrame(rafId)
            }
        }
    }, [handleWheel, updateScrollShadows, updateStickyScrollbar])

    // Thumb drag listeners
    useEffect(() => {
        if (isThumbDragging) {
            window.addEventListener('mousemove', handleThumbMouseMove)
            window.addEventListener('mouseup', handleThumbMouseUp)
            return () => {
                window.removeEventListener('mousemove', handleThumbMouseMove)
                window.removeEventListener('mouseup', handleThumbMouseUp)
            }
        }
    }, [isThumbDragging, handleThumbMouseMove, handleThumbMouseUp])

    return (
        <>
            <div className="relative rounded-xl overflow-hidden">
                <div
                    ref={tableContainerRef}
                    className={cn(
                        "overflow-x-auto overflow-y-visible",
                        "scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200",
                        isDragging ? "cursor-grabbing select-none" : "cursor-grab",
                        className
                    )}
                    onScroll={updateScrollShadows}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUpOrLeave}
                    onMouseLeave={handleMouseUpOrLeave}
                    style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#9CA3AF #E5E7EB'
                    }}
                >
                    {/* Left scroll shadow */}
                    <div
                        className={cn(
                            "absolute left-0 top-0 bottom-0 w-8 pointer-events-none transition-opacity duration-300 z-10",
                            showLeftShadow ? "opacity-100" : "opacity-0"
                        )}
                        style={{
                            background: 'linear-gradient(to right, rgba(0,0,0,0.08), transparent)'
                        }}
                    />

                    {/* Right scroll shadow */}
                    <div
                        className={cn(
                            "absolute right-0 top-0 bottom-0 w-8 pointer-events-none transition-opacity duration-300 z-10",
                            showRightShadow ? "opacity-100" : "opacity-0"
                        )}
                        style={{
                            background: 'linear-gradient(to left, rgba(0,0,0,0.08), transparent)'
                        }}
                    />

                    {children}
                </div>

                {/* Helper text for users */}
                {showRightShadow && (
                    <div className="text-xs text-gray-400 mt-2 text-center animate-in fade-in slide-in-from-top-1 duration-500">
                        💡 Tip: Hold Shift + scroll, or click & drag to scroll horizontally
                    </div>
                )}
            </div>

            {/* Custom Sticky Scrollbar - Fixed at bottom of viewport */}
            {showStickyScrollbar && (
                <div
                    ref={stickyScrollbarRef}
                    className="fixed bottom-0 h-3.5 bg-gray-300 backdrop-blur-md border-slate-700/50 z-50 cursor-pointer shadow-lg animate-in slide-in-from-bottom-2 duration-300 rounded-full"
                    onClick={handleStickyScrollbarClick}
                    style={{
                        width: `${stickyScrollbarWidth}px`,
                        left: `${stickyScrollbarLeft}px`
                    }}
                >
                    <div
                        ref={stickyScrollbarThumbRef}
                        className={cn(
                            "h-full rounded-full transition-all duration-200 ease-out",
                            isThumbDragging
                                ? "bg-gray-500 shadow-lg scale-105"
                                : "bg-gray-400 hover:bg-gray-500 hover:shadow-md cursor-grab active:cursor-grabbing"
                        )}
                        onMouseDown={handleThumbMouseDown}
                        style={{
                            width: `${thumbWidth}px`,
                            willChange: 'transform',
                            transition: isThumbDragging ? 'none' : 'background-color 200ms ease-out, box-shadow 200ms ease-out, transform 200ms ease-out'
                        }}
                    />
                </div>
            )}
        </>
    )
}
