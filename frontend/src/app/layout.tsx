import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import Providers from "./providers"
import "styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <main className="relative">{props.children}</main>
        </Providers>
        <SpeedInsights />
      </body>
    </html>
  )
}
