"use client";

import { useEffect } from "react";

export default function PWARegistration() {
    useEffect(() => {
        // Prevent registration in development mode to avoid 404 errors
        // (Service worker generation is disabled in development for performance)
        if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
            window.addEventListener("load", () => {
                navigator.serviceWorker
                    .register("/sw.js")
                    .then((registration) => {
                        console.log("PWA Service Worker registered with scope:", registration.scope);
                    })
                    .catch((error) => {
                        console.error("PWA Service Worker registration failed:", error);
                    });
            });
        }
    }, []);

    return null;
}
