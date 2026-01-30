"use client"

import React, { useState, useEffect } from "react"
import Modal from "@modules/common/components/modal"
import { cn } from "@lib/util/cn"

type SocialShareModalProps = {
    isOpen: boolean
    close: () => void
    productTitle: string
}

const SocialShareModal: React.FC<SocialShareModalProps> = ({
    isOpen,
    close,
    productTitle,
}) => {
    const [copied, setCopied] = useState(false)
    const [url, setUrl] = useState("")

    useEffect(() => {
        if (typeof window !== "undefined") {
            setUrl(window.location.href)
        }
    }, [isOpen])

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error("Failed to copy text: ", err)
        }
    }

    const encodedUrl = encodeURIComponent(url)
    const encodedTitle = encodeURIComponent(productTitle)

    const socialPlatforms = [
        {
            name: "Facebook",
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
            ),
            color: "bg-[#3b5998]",
            link: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        },
        {
            name: "Twitter",
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
            ),
            color: "bg-[#1da1f2]",
            link: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
        },
        {
            name: "Pinterest",
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.966 1.406-5.966s-.359-.72-.359-1.781c0-1.667.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z" />
                </svg>
            ),
            color: "bg-[#bd081c]",
            link: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}`,
        },
        {
            name: "LinkedIn",
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
            ),
            color: "bg-[#0077b5]",
            link: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        },
        {
            name: "Reddit",
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm6.67 15.557c.056.39-.171.763-.535.862-1.22.333-3.024.498-4.135.498-1.11 0-2.915-.165-4.135-.498-.363-.099-.591-.472-.535-.862.056-.39.408-.654.793-.563.957.262 2.5.401 3.877.401 1.377 0 2.92-.139 3.877-.401.385-.091.737.173.793.563zm-.463-5.07c.504 0 .913.409.913.913 0 .504-.409.913-.913.913-.504 0-.913-.409-.913-.913 0-.504.409-.913.913-.913zm-8.414 0c.504 0 .913.409.913.913 0 .504-.409.913-.913.913-.504 0-.913-.409-.913-.913 0-.504.409-.913.913-.913zm12.207-1.14c0 1.155-.778 2.14-1.854 2.457.01.127.015.256.015.385 0 2.228-2.618 4.032-5.848 4.032-3.23 0-5.848-1.804-5.848-4.032 0-.129.006-.258.015-.385-1.077-.317-1.854-1.302-1.854-2.457 0-1.424 1.156-2.583 2.583-2.583.563 0 1.082.186 1.503.497 1.258-.87 2.986-1.428 4.904-1.507l1.01-4.733 3.32.71c.01.763.63 1.373 1.388 1.373.768 0 1.391-.623 1.391-1.391S20.016 1.9 19.248 1.9c-.612 0-1.134.398-1.319.95l-2.812-.602-.857 4.01c1.86.103 3.535.673 4.75 1.516.425-.333.966-.525 1.554-.525 1.427 0 2.583 1.159 2.583 2.583z" />
                </svg>
            ),
            color: "bg-[#ff4500]",
            link: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
        },
        {
            name: "WhatsApp",
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
            ),
            color: "bg-[#25d366]",
            link: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
        },
    ]

    return (
        <Modal isOpen={isOpen} close={close} size="medium">
            <Modal.Body>
                <div className="flex flex-col w-full gap-4 pt-2">
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-slate-900">Copy Link</span>
                        {copied && (
                            <span className="text-lg font-bold text-[#E7353A]">Copied</span>
                        )}
                    </div>

                    <button
                        onClick={handleCopy}
                        className="w-full p-4 bg-[#F0F2F5] rounded-lg text-left overflow-hidden group hover:bg-gray-200 transition-colors"
                    >
                        <p className="text-sm font-medium text-slate-700 truncate">
                            {url}
                        </p>
                    </button>

                    <p className="text-sm text-slate-400 font-medium">
                        You can share the product with your friends
                    </p>

                    <div className="flex flex-wrap gap-2.5 pt-2">
                        {socialPlatforms.map((platform) => (
                            <a
                                key={platform.name}
                                href={platform.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                    "flex items-center justify-center w-11 h-11 rounded-md text-white transition-transform hover:scale-105 active:scale-95",
                                    platform.color
                                )}
                                aria-label={`Share on ${platform.name}`}
                            >
                                {platform.icon}
                            </a>
                        ))}
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    )
}

export default SocialShareModal
