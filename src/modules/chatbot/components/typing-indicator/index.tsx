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
                className="
          bg-blue-50
          px-4 py-3
          rounded-2xl rounded-tl-md
          flex items-center gap-1.5
        "
                aria-label="Assistant is typing"
                role="status"
            >
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-typing-dot" />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-typing-dot" />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-typing-dot" />
            </div>
        </div>
    )
}
