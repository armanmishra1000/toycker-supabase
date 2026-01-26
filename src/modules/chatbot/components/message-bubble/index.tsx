"use client"

/**
 * Message Bubble Component
 * Simplified design based on user's recent modifications
 */

import { ChatMessage, QuickReply } from '../../types'
import QuickReplyButtons from '../quick-reply-buttons'
import OrderStatusCard from '../order-status-card'

interface MessageBubbleProps {
    message: ChatMessage
    onQuickReplyClick: (reply: QuickReply) => void
}

// Simple bold text parser
function formatText(text: string): React.ReactNode {
    const parts = text.split(/(\*\*.*?\*\*)/g)

    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return (
                <strong key={index} className="font-semibold text-slate-800">
                    {part.slice(2, -2)}
                </strong>
            )
        }
        return part
    })
}

export default function MessageBubble({ message, onQuickReplyClick }: MessageBubbleProps) {
    const isBot = message.sender === 'bot'

    return (
        <div className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] ${isBot ? '' : ''}`}>
                {/* Bot avatar for bot messages */}
                {isBot && (
                    <div className="flex items-start gap-2.5">
                        {/* Small avatar */}
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 overflow-hidden">
                            <img
                                src="/icon-512x512.png"
                                alt="Toycker"
                                className="w-full h-full object-contain p-0.5"
                            />
                        </div>

                        {/* Message content */}
                        <div className="flex-1 space-y-3">
                            {message.content && (
                                <div className="bg-blue-50 text-slate-700 px-4 py-3 rounded-2xl rounded-tl-md text-[14px] leading-relaxed whitespace-pre-wrap">
                                    {formatText(message.content)}
                                </div>
                            )}

                            {/* Order Status Card as part of the message */}
                            {message.type === 'order_status' && message.orderData && !Array.isArray(message.orderData) && (
                                <div className="mt-2 -ml-10 sm:-ml-12">
                                    <OrderStatusCard order={message.orderData} />
                                </div>
                            )}

                            {/* Quick replies for bot messages */}
                            {message.quickReplies && message.quickReplies.length > 0 && (
                                <QuickReplyButtons
                                    replies={message.quickReplies}
                                    onReplyClick={onQuickReplyClick}
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* User messages */}
                {!isBot && (
                    <div className="bg-blue-600 text-white px-4 py-3 rounded-2xl rounded-tr-md text-[14px] leading-relaxed whitespace-pre-wrap">
                        {message.content}
                    </div>
                )}
            </div>
        </div>
    )
}
