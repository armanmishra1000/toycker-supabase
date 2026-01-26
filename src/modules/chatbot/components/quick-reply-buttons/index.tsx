"use client"

/**
 * Quick Reply Buttons Component
 * Modern Tidio-inspired pill-style buttons with smooth hover effects
 */

import { QuickReply } from '../../types'

interface QuickReplyButtonsProps {
    replies: QuickReply[]
    onReplyClick: (reply: QuickReply) => void
}

export default function QuickReplyButtons({ replies, onReplyClick }: QuickReplyButtonsProps) {
    if (!replies || replies.length === 0) return null

    return (
        <div
            className="flex flex-wrap gap-2 mt-1 ml-0.5"
            role="group"
            aria-label="Quick reply options"
        >
            {replies.map((reply) => (
                <button
                    key={reply.id}
                    onClick={() => onReplyClick(reply)}
                    className="px-4 py-2 bg-white text-slate-700 text-[13px] font-medium rounded-xl border border-gray-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all duration-200 ease-out focus:outline-none"
                    aria-label={reply.label}
                >
                    {reply.label}
                </button>
            ))}
        </div>
    )
}
