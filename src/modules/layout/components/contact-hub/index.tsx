"use client"

import React, { useState } from "react"
import { MessageCircle, X, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@lib/util/cn"
import { useChatbot } from "@modules/chatbot/context/chatbot-context"

const ContactHub = () => {
    const [isExpanded, setIsExpanded] = useState(false)
    const { toggle, state } = useChatbot()

    const phoneNumber = "919925819694"
    const message = "Hello Toycker, I have a question about your products!"
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`

    return (
        <div className="fixed right-0 bottom-[70px] sm:bottom-14 z-[85] flex flex-col items-end gap-2 transition-all duration-300 pointer-events-none contact-hub-wrapper">
            {/* WhatsApp Button */}
            <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                    "pointer-events-auto flex items-center gap-3 bg-[#25D366] text-white py-2.5 pl-3 pr-5 shadow-xl transition-all duration-500 hover:translate-x-0 ease-in-out group",
                    "rounded-l-full border-y border-l border-white/20",
                    isExpanded ? "translate-x-0" : "translate-x-[calc(100%-40px)]"
                )}
            >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center transition-transform group-hover:scale-110">
                    <svg viewBox="0 0 24 24" className="h-[22px] w-[22px] fill-current">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.394 0 12.03c0 2.119.553 4.187 1.602 6.006L0 24l6.111-1.603a11.82 11.82 0 005.934 1.6h.005c6.635 0 12.032-5.395 12.035-12.032a11.77 11.77 0 00-3.488-8.49" />
                    </svg>
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap">WhatsApp</span>
            </a>

            {/* Chat Button */}
            <button
                onClick={toggle}
                className={cn(
                    "pointer-events-auto flex items-center gap-3 bg-blue-600 text-white py-2.5 pl-3 pr-5 shadow-xl transition-all duration-500 hover:translate-x-0 ease-in-out group",
                    "rounded-l-full border-y border-l border-white/20",
                    isExpanded ? "translate-x-0" : "translate-x-[calc(100%-40px)]"
                )}
            >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center transition-transform group-hover:scale-110">
                    <MessageCircle className="h-[22px] w-[22px]" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap">Live Chat</span>
            </button>

            {/* Toggle Handle */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="pointer-events-auto mr-1 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-slate-900 border border-slate-200 shadow-md backdrop-blur-md transition-all hover:bg-white active:scale-95"
            >
                {isExpanded ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
        </div>
    )
}

export default ContactHub
