"use client";

import dynamic from "next/dynamic";

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
