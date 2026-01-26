"use client"

/**
 * Chatbot Header Component
 * Modern Tidio-inspired design with avatar, status indicator, and clean controls
 */

import { RotateCcw, X, Minus } from 'lucide-react'

interface ChatbotHeaderProps {
    onClose: () => void
    onReset: () => void
}

export default function ChatbotHeader({ onClose, onReset }: ChatbotHeaderProps) {
    return (
        <header className="
      bg-gradient-to-r from-blue-600 to-blue-500
      px-5 py-4
      flex items-center justify-between
      flex-shrink-0
    ">
            {/* Left side - Avatar and Info */}
            <div className="flex items-center gap-3">
                {/* Avatar Group */}
                <div className="relative">
                    <div className="
            w-11 h-11
            rounded-full
            flex items-center justify-center
            shadow-md
            overflow-hidden
            bg-primary
          ">
                        <img
                            src="/icon-512x512.png"
                            alt="Toycker"
                            className="w-full h-full object-contain p-1"
                        />
                    </div>
                    {/* Online indicator */}
                    <span className="
            absolute -bottom-0.5 -right-0.5
            w-3.5 h-3.5
            bg-emerald-400
            border-2 border-blue-600
            rounded-full
          " />
                </div>

                {/* Text Info */}
                <div>
                    <h3 className="text-white font-semibold text-[15px] leading-tight">
                        Toycker Support
                    </h3>
                </div>
            </div>

            {/* Right side - Controls */}
            <div className="flex items-center gap-1">
                {/* Reset Button */}
                <button
                    onClick={onReset}
                    className="
            p-2.5
            text-white/70 hover:text-white
            hover:bg-white/10
            rounded-full
            transition-all duration-200
          "
                    aria-label="Reset conversation"
                    title="Start new conversation"
                >
                    <RotateCcw className="w-4 h-4" strokeWidth={2} />
                </button>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="
            p-2.5
            text-white/70 hover:text-white
            hover:bg-white/10
            rounded-full
            transition-all duration-200
          "
                    aria-label="Close chat"
                    title="Close"
                >
                    <X className="w-4 h-4" strokeWidth={2.5} />
                </button>
            </div>
        </header>
    )
}
