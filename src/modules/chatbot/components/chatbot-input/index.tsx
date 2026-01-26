"use client"

/**
 * Chatbot Input Component
 * Modern Tidio-inspired design with clean input area and icon-only send button
 */

import { useState, useRef, FormEvent, KeyboardEvent } from 'react'
import { Send } from 'lucide-react'

interface ChatbotInputProps {
    onSend: (message: string) => void
    disabled?: boolean
}

export default function ChatbotInput({ onSend, disabled }: ChatbotInputProps) {
    const [input, setInput] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    const handleSubmit = (e?: FormEvent) => {
        e?.preventDefault()
        if (input.trim() && !disabled) {
            onSend(input.trim())
            setInput('')
        }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    return (
        <div className="p-4 bg-white border-t border-gray-200 flex-shrink-0">
            <form
                onSubmit={handleSubmit}
                className="flex items-center gap-2 bg-blue-50 rounded-2xl px-4 py-2.5 transition-all duration-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-200 border border-transparent">
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    disabled={disabled}
                    className="flex-1 bg-transparent border-none outline-none text-[14px] text-slate-700 placeholder:text-black-400 disabled:cursor-not-allowed" />

                <button
                    type="submit"
                    disabled={!input.trim() || disabled}
                    className="flex items-center justify-center w-9 h-9 rounded-xl text-white bg-gradient-to-br from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                    aria-label="Send message"
                >
                    <Send className="w-[18px] h-[18px]" strokeWidth={2.5} />
                </button>
            </form>
        </div>
    )
}
