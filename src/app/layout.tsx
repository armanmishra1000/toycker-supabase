import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import NextTopLoader from "nextjs-toploader"
import Providers from "./providers"
import "@/styles/globals.css"
import { retrieveCustomer } from "@lib/data/customer"
import { getWishlistItems } from "@lib/data/wishlist"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  icons: {
    icon: "/favicon.jpg",
  },
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const [customer, wishlistItems] = await Promise.all([
    retrieveCustomer(),
    getWishlistItems(),
  ])

  return (
    <html lang="en" data-mode="light" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {/* <NextTopLoader color="#059669" showSpinner={false} height={3} /> */}
        <Providers
          isAuthenticated={Boolean(customer)}
          initialWishlistItems={wishlistItems}
        >
          <main className="relative">{props.children}</main>
        </Providers>
        <SpeedInsights />
      </body>
    </html>
  )
}
