"use client"

/**
 * Chatbot Widget Component
 * Modern Tidio-inspired design with clean, spacious, trust-building UI
 */

import { useEffect, useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { useChatbot } from '../../context/chatbot-context'
import { useOptionalCartSidebar } from '@modules/layout/context/cart-sidebar-context'
import ChatbotHeader from '../chatbot-header'
import ChatbotMessages from '../chatbot-messages'
import ChatbotInput from '../chatbot-input'
import ChatbotLoginForm from '../chatbot-login-form'

export default function ChatbotWidget() {
    const {
        state,
        toggle,
        close,
        sendMessage,
        handleQuickReply,
        resetChat,
        showLoginForm,
        loginError,
        isLoggingIn,
        handleLogin,
        cancelLogin,
    } = useChatbot()
    const cartSidebar = useOptionalCartSidebar()
    const isCartOpen = cartSidebar?.isOpen || false
    const [isMounted, setIsMounted] = useState(false)

    // Prevent hydration mismatch
    useEffect(() => {
        setIsMounted(true)
    }, [])

    if (!isMounted || isCartOpen) {
        return null
    }

    return (
        <>
            {/* Chat Window */}
            {state.isOpen && (
                <div
                    className="
                        fixed 
                        bottom-[100px] sm:bottom-24
                        right-4
                        w-[calc(100vw-2rem)] sm:w-[400px]
                        max-w-[420px]
                        h-[580px] sm:h-[620px]
                        max-h-[calc(100vh-120px)]
                        bg-white 
                        rounded-3xl
                        shadow-[0_20px_60px_rgba(0,0,0,0.12)]
                        flex flex-col
                        z-[140]
                        overflow-hidden
                        animate-chat-open
                    "
                    role="dialog"
                    aria-label="Chat with Toycker Assistant"
                    aria-modal="true"
                >
                    {/* Header */}
                    <ChatbotHeader onClose={close} onReset={resetChat} />

                    {/* Messages container */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <ChatbotMessages
                            messages={state.messages}
                            isTyping={state.isTyping}
                            onQuickReplyClick={handleQuickReply}
                        />

                        {/* Login Form (if showing) */}
                        {showLoginForm && (
                            <ChatbotLoginForm
                                onLogin={handleLogin}
                                onCancel={cancelLogin}
                                isLoading={isLoggingIn}
                                error={loginError || undefined}
                            />
                        )}
                    </div>

                    {/* Input (hide when login form is showing) */}
                    {!showLoginForm && (
                        <ChatbotInput
                            onSend={sendMessage}
                            disabled={state.isTyping}
                        />
                    )}
                </div>
            )}

            {/* Launcher Button - Modern pill style with gradient */}
            <button
                onClick={toggle}
                className={`
          fixed 
          bottom-[84px] sm:bottom-6 
          right-4
          h-14 sm:h-[60px]
          rounded-full
          text-white
          flex items-center justify-center
          transition-all duration-300 ease-out
          hover:scale-105
          active:scale-95
          focus:outline-none
          z-[140]
          group
          bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600
          ${state.isOpen
                        ? 'w-14 sm:w-[60px]'
                        : 'w-14 sm:w-auto sm:px-5'
                    }
        `}
                aria-label={state.isOpen ? 'Close chat' : 'Chat with us'}
                aria-expanded={state.isOpen}
            >
                {state.isOpen ? (
                    <X className="w-6 h-6" strokeWidth={2.5} />
                ) : (
                    <>
                        <MessageCircle className="w-6 h-6 sm:mr-2" strokeWidth={2} />
                        <span className="hidden sm:inline font-medium text-[15px]">Chat with us</span>
                    </>
                )}
            </button>
        </>
    )
}
