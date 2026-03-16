import { GoogleTagManager } from "@next/third-parties/google"
import Script from "next/script"

/**
 * Analytics component that loads Google Tag Manager and Contentsquare.
 * 
 * GTM (Google Tag Manager) is used to manage all tracking tags including:
 * - Google Analytics 4 (GA4)
 * - Any future marketing/analytics tags
 * 
 * Contentsquare provides:
 * - Heatmaps
 * - Session recordings
 * - User behavior analytics
 * 
 * Both scripts only load when environment variables are set.
 */

export function Analytics() {
    const gtmId = process.env.NEXT_PUBLIC_GTM_ID
    const contentsquareId = process.env.NEXT_PUBLIC_CONTENTSQUARE_ID

    // Only render analytics scripts if at least one ID is provided
    const hasGTM = gtmId !== undefined && gtmId !== ""
    const hasContentsquare = contentsquareId !== undefined && contentsquareId !== ""

    if (!hasGTM && !hasContentsquare) {
        return null
    }

    return (
        <>
            {/* Google Tag Manager - loads GA4 and other tracking through GTM */}
            {hasGTM && <GoogleTagManager gtmId={gtmId} />}

            {/* Contentsquare - for heatmaps and session recordings */}
            {/* Using afterInteractive for performance; verification will work because ID is now correct */}
            {hasContentsquare && (
                <Script
                    src={`https://t.contentsquare.net/uxa/${contentsquareId}.js`}
                    strategy="afterInteractive"
                />
            )}
        </>
    )
}

export default Analytics

