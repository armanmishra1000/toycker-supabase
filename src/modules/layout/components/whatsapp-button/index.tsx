"use client"

import React from "react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

function clx(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

const WhatsAppButton = () => {
    const phoneNumber = "919925819694"
    const message = "Hello Toycker, I have a question about your products!"
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`

    return (
        <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with us on WhatsApp"
            className={clx(
                "fixed right-6 z-30 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95",
                "bg-[#25D366] text-white",
                "bottom-24 md:bottom-8", // Above mobile nav (h-16 + spacing) and standard bottom on desktop
                "animate-bounce-subtle" // Custom subtle bounce
            )}
        >
            <svg
                viewBox="0 0 24 24"
                width="32"
                height="32"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.394 0 12.03c0 2.119.553 4.187 1.602 6.006L0 24l6.111-1.603a11.82 11.82 0 005.934 1.6h.005c6.635 0 12.032-5.395 12.035-12.032a11.77 11.77 0 00-3.488-8.49" />
            </svg>
        </a>
    )
}

export default WhatsAppButton
