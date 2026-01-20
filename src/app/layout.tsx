import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"
import NextTopLoader from "nextjs-toploader"
import Providers from "./providers"
import { grandstander, inter } from "@lib/fonts"
import dynamic from "next/dynamic"

const PWARegistration = dynamic(() => import("@/components/pwa-registration"), {
  ssr: false,
})
const PWAInstallPrompt = dynamic(
  () => import("@modules/layout/components/pwa-install-prompt"),
  {
    ssr: false,
  }
)
import "@/styles/globals.css"

export const metadata: Metadata = {
  title: {
    template: "%s | Toycker",
    default: "Toycker | Premium Toys & Collectibles",
  },
  description: "Shop the best selection of action figures, building sets, and educational toys at Toycker. Exclusive collections and free shipping on orders over ₹999.",
  keywords: ["toys", "action figures", "building blocks", "educational toys", "Toycker"],
  metadataBase: new URL(getBaseURL()),
  icons: {
    icon: "/favicon.jpg",
  },
}

export default function RootLayout(props: { children: React.ReactNode }) {
  // Removed server-side data fetching to enable static rendering
  // Auth and wishlist data now fetched client-side by providers
  return (
    <html lang="en" data-mode="light" suppressHydrationWarning className={`${grandstander.variable} ${inter.variable}`}>
      <head>
        <link rel="preconnect" href="https://cdn.toycker.in" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://toycker-supabase.r2.dev" crossOrigin="anonymous" />
      </head>
      <body suppressHydrationWarning className="font-sans">
        <NextTopLoader color="#059669" showSpinner={false} height={3} />
        <Providers>
          <main className="relative">{props.children}</main>
          <PWARegistration />
          <PWAInstallPrompt />
        </Providers>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
