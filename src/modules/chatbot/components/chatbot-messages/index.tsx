"use client"

/**
 * Chatbot Messages Component
 * Modern Tidio-inspired message list with clean bubbles and smooth animations
 */

import { useEffect, useRef } from 'react'
import { ChatMessage, QuickReply } from '../../types'
import MessageBubble from '../message-bubble'
import TypingIndicator from '../typing-indicator'

interface ChatbotMessagesProps {
    messages: ChatMessage[]
    isTyping: boolean
    onQuickReplyClick: (reply: QuickReply) => void
}

export default function ChatbotMessages({
    messages,
    isTyping,
    onQuickReplyClick
}: ChatbotMessagesProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        const scrollToBottom = () => {
            if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
            }
        }

        // Delay slightly to ensure content is measured and animations started
        const timeoutId = setTimeout(scrollToBottom, 50)
        return () => clearTimeout(timeoutId)
    }, [messages, isTyping])

    return (
        <div
            ref={containerRef}
            className="
        flex-1 
        overflow-y-auto 
        pl-5 pr-2 py-5
        custom-scrollbar mr-1 my-1
      "
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
        >
            {/* Welcome message area - extra spacing at top */}
            <div className="flex flex-col gap-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className="animate-message-pop"
                    >
                        <MessageBubble
                            message={message}
                            onQuickReplyClick={onQuickReplyClick}
                        />
                    </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                    <div className="animate-message-pop">
                        <TypingIndicator />
                    </div>
                )}
            </div>

            {/* Scroll anchor */}
            <div ref={messagesEndRef} className="h-1" />
        </div>
    )
}
