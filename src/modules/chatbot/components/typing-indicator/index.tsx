"use client"

/**
 * Typing Indicator Component
 * Simplified design with smooth bouncing dots
 */

export default function TypingIndicator() {
    return (
        <div className="flex items-start gap-2.5">
            {/* Small avatar */}
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img
                    src="/icon-512x512.png"
                    alt="Toycker"
                    className="w-full h-full object-contain p-0.5"
                />
            </div>

            {/* Typing bubble */}
            <div
                className="flex items-center py-1"
                aria-label="Assistant is typing"
                role="status"
            >
                <span className="animate-text-shimmer text-sm font-medium">Typing...</span>
            </div>
        </div>
    )
}
