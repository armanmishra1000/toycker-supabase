"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: "accepted" | "dismissed";
        platform: string;
    }>;
    prompt(): Promise<void>;
}

interface PWAContextType {
    isInstallable: boolean;
    isStandalone: boolean;
    isIOS: boolean;
    showInstallPrompt: () => Promise<void>;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function PWAProvider({ children }: { children: React.ReactNode }) {
    const [isInstallable, setIsInstallable] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

    useEffect(() => {
        // Detect standalone mode
        const standalone = window.matchMedia("(display-mode: standalone)").matches;
        setIsStandalone(standalone);

        // Detect iOS
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !((window as any).MSStream);
        setIsIOS(ios);

        if (ios) {
            setIsInstallable(true);
        }

        const handler = (e: Event) => {
            e.preventDefault();
            const promptEvent = e as BeforeInstallPromptEvent;
            deferredPromptRef.current = promptEvent;
            setIsInstallable(true);
            console.log("PWA install prompt is ready");
        };

        window.addEventListener("beforeinstallprompt", handler);

        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const showInstallPrompt = async () => {
        if (isIOS) {
            // iOS instructions are usually handled by a modal
            return;
        }

        if (!deferredPromptRef.current) {
            console.warn("PWA install prompt not available");
            return;
        }

        try {
            await deferredPromptRef.current.prompt();
            const { outcome } = await deferredPromptRef.current.userChoice;
            console.log(`User ${outcome} the PWA install prompt`);
            deferredPromptRef.current = null;
            setIsInstallable(false);
        } catch (error) {
            console.error("Error showing PWA install prompt:", error);
        }
    };

    return (
        <PWAContext.Provider value={{ isInstallable, isStandalone, isIOS, showInstallPrompt }}>
            {children}
        </PWAContext.Provider>
    );
}

export function usePWA() {
    const context = useContext(PWAContext);
    if (context === undefined) {
        throw new Error("usePWA must be used within a PWAProvider");
    }
    return context;
}
