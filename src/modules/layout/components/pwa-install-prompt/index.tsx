"use client";

import Modal from "@modules/common/components/modal";
import { Button } from "@modules/common/components/button";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Smartphone, Download, Apple, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: "accepted" | "dismissed";
        platform: string;
    }>;
    prompt(): Promise<void>;
}

export default function PWAInstallPrompt() {
    const [showModal, setShowModal] = useState(false);
    const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if already dismissed
        const isDismissed = localStorage.getItem("pwa_prompt_dismissed");
        if (isDismissed) return;

        // Check if already installed
        const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
        if (isStandalone) return;

        // Detect iOS
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !((window as any).MSStream);
        setIsIOS(ios);

        // For iOS, show immediately as there's no beforeinstallprompt event
        if (ios) {
            setShowModal(true);
            return;
        }

        // For Chromium/Android, wait for the beforeinstallprompt event
        const handler = (e: Event) => {
            e.preventDefault();
            const promptEvent = e as BeforeInstallPromptEvent;
            deferredPromptRef.current = promptEvent;

            // Only show modal AFTER we have the deferred prompt
            setShowModal(true);
        };

        window.addEventListener("beforeinstallprompt", handler);

        // Fallback: If no prompt event fires within 3 seconds,
        // show modal anyway (might be already installable or browser doesn't support it)
        const timeout = setTimeout(() => {
            if (!deferredPromptRef.current) {
                setShowModal(true);
            }
        }, 3000);

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
            clearTimeout(timeout);
        };
    }, []);

    const handleDismiss = () => {
        localStorage.setItem("pwa_prompt_dismissed", "true");
        setShowModal(false);
    };

    const handleInstall = async () => {
        if (!deferredPromptRef.current) {
            // If no deferred prompt, show instructions or close
            console.warn("PWA install prompt not available");
            // On Android/Chrome, if the prompt isn't available,
            // the app might already be installed or browser doesn't support it
            setShowModal(false);
            return;
        }

        try {
            await deferredPromptRef.current.prompt();
            const { outcome } = await deferredPromptRef.current.userChoice;

            if (outcome === "accepted") {
                console.log("User accepted the PWA install prompt");
                localStorage.setItem("pwa_prompt_dismissed", "true");
            } else {
                console.log("User dismissed the PWA install prompt");
            }

            deferredPromptRef.current = null;
            setShowModal(false);
        } catch (error) {
            console.error("Error showing install prompt:", error);
            setShowModal(false);
        }
    };

    if (!showModal) return null;

    return (
        <Modal
            isOpen={showModal}
            close={handleDismiss}
            closeOnOutsideClick={false}
            closeOnEscape={false}
            size="medium"
            panelPadding="none"
            overflowHidden
        >
            <div className="relative flex flex-col w-full h-full overflow-hidden">
                {/* Background Image Header */}
                <div className="relative w-full aspect-square sm:aspect-video overflow-hidden">
                    <Image
                        src="/assets/images/pwa-post.png"
                        alt="Toycker App"
                        fill
                        className="object-cover"
                        priority
                        unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                    {/* Close Button on Image */}
                    <button
                        onClick={handleDismiss}
                        className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Top Text Overlay */}
                    <div className="absolute bottom-6 left-6 right-6 text-white">
                        <h2 className="text-2xl font-bold font-grandstander leading-tight">
                            Download Our App
                        </h2>
                        <p className="text-white/80 text-sm mt-1">
                            Experience the best of Toycker anywhere, anytime.
                        </p>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-6 bg-white flex flex-col gap-5">
                    <div className="flex flex-col gap-1">
                        <p className="text-gray-700 text-sm leading-relaxed">
                            Install our app for a faster shopping experience, exclusive app-only deals, and offline access to your orders.
                        </p>
                    </div>

                    {isIOS ? (
                        <div className="space-y-4">
                            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
                                <p className="text-xs font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                                    <Apple className="w-4 h-4" /> Quick Steps for iPhone Users:
                                </p>
                                <ul className="text-xs text-emerald-800 space-y-2">
                                    <li className="flex items-start gap-2">
                                        <span className="bg-emerald-200 text-emerald-900 w-4 h-4 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">1</span>
                                        <span>Tap the Share icon <Download className="inline-block w-3 h-3 rotate-180 mx-0.5" /> in Safari.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="bg-emerald-200 text-emerald-900 w-4 h-4 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">2</span>
                                        <span>Scroll down and select <span className="font-bold">"Add to Home Screen"</span>.</span>
                                    </li>
                                </ul>
                            </div>
                            <Button
                                variant="primary"
                                onClick={handleDismiss}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 rounded-xl text-md font-semibold"
                            >
                                Got it
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <Button
                                variant="primary"
                                onClick={handleInstall}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 rounded-xl text-md font-semibold flex items-center justify-center gap-2"
                            >
                                <Download className="w-5 h-5" /> Install App
                            </Button>
                            <button
                                onClick={handleDismiss}
                                className="w-full h-10 text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors"
                            >
                                Maybe later
                            </button>
                        </div>
                    )}
                </div>

                {/* Branding footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-emerald-600 flex items-center justify-center overflow-hidden">
                            <Image src="/favicon.png" width={24} height={24} alt="T" unoptimized />
                        </div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Toycker Official</span>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
