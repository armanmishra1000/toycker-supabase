"use client"

import React, { useState, useEffect } from "react"
import Modal from "@modules/common/components/modal"
import { cn } from "@lib/util/cn"
import {
    FaFacebookF,
    FaPinterestP,
    FaLinkedinIn,
    FaRedditAlien,
    FaWhatsapp
} from "react-icons/fa"
import { FaXTwitter } from "react-icons/fa6"

type ShareModalProps = {
    isOpen: boolean
    close: () => void
    productTitle: string
}

const ShareModal: React.FC<ShareModalProps> = ({
    isOpen,
    close,
    productTitle,
}) => {
    const [copied, setCopied] = useState(false)
    const [url, setUrl] = useState("")

    useEffect(() => {
        if (isOpen) {
            if (typeof window !== "undefined") {
                setUrl(window.location.href)
            }
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
            icon: <FaFacebookF className="w-5 h-5" />,
            color: "bg-[#3b5998]",
            link: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        },
        {
            name: "Twitter",
            icon: <FaXTwitter className="w-5 h-5" />,
            color: "bg-[#1da1f2]",
            link: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
        },
        {
            name: "Pinterest",
            icon: <FaPinterestP className="w-5 h-5" />,
            color: "bg-[#bd081c]",
            link: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}`,
        },
        {
            name: "LinkedIn",
            icon: <FaLinkedinIn className="w-5 h-5" />,
            color: "bg-[#0077b5]",
            link: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        },
        {
            name: "Reddit",
            icon: <FaRedditAlien className="w-5 h-5" />,
            color: "bg-[#ff4500]",
            link: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
        },
        {
            name: "WhatsApp",
            icon: <FaWhatsapp className="w-5 h-5" />,
            color: "bg-[#25d366]",
            link: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
        },
    ]

    return (
        <Modal isOpen={isOpen} close={close} size="medium">
            <Modal.Title>
                Share
            </Modal.Title>

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

export default ShareModal
