import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import NextTopLoader from "nextjs-toploader"
import Providers from "./providers"
import "@/styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <NextTopLoader color="#10b981" showSpinner={false} height={3} />
        <Providers>
          <main className="relative">{props.children}</main>
        </Providers>
        <SpeedInsights />
      </body>
    </html>
  )
}
