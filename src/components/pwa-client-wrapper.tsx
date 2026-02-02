"use client";

import dynamic from "next/dynamic";
import { PWAProvider } from "@modules/layout/components/pwa-install-prompt/PWAContext";

const PWARegistration = dynamic(() => import("@/components/pwa-registration"), {
    ssr: false,
});
const PWAInstallPrompt = dynamic(
    () => import("@modules/layout/components/pwa-install-prompt"),
    {
        ssr: false,
    }
);

export default function PWAClientWrapper() {
    return (
        <>
            <PWARegistration />
            <PWAInstallPrompt />
        </>
    );
}
