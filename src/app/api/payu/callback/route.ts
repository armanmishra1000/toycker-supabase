import { NextRequest, NextResponse } from "next/server"
import { verifyPayUHash } from "@/lib/payu"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function htmlRedirect(path: string) {
  return new NextResponse(
    `<!doctype html><html><body>
      <p>Redirecting back to store...</p>
      <script>window.location.replace(${JSON.stringify(path)})</script>
    </body></html>`,
    { status: 200, headers: { "content-type": "text/html; charset=utf-8" } }
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const payload = Object.fromEntries(new URLSearchParams(body))

    console.log("[PAYU] callback hit", payload.status, payload.txnid)

    const key = String(payload.key || "")
    let salt = process.env.PAYU_MERCHANT_SALT || ""
    
    // Fallback for test key if salt is missing
    if (key === "gtKFFx" && !salt) {
      salt = "4R38IvwiV57FwVpsgOvTXBdLE4tHUXFW" 
    }

    if (!verifyPayUHash(payload, salt)) {
      console.error("[PAYU] invalid hash signature")
      return htmlRedirect("/checkout?step=payment&error=invalid_hash")
    }

    const status = String(payload.status || "")
    const cartId = String(payload.udf1 || "")

    if (status === "success") {
      // NOTE: Database logic is temporarily disabled to verify the redirect flow first.
      // Once we confirm users land back on the site, we will re-enable order creation.
      console.log("[PAYU] payment successful, redirecting to confirmation")
      return htmlRedirect(`/checkout?step=payment&success=1&cart=${encodeURIComponent(cartId)}`)
    }

    return htmlRedirect(`/checkout?step=payment&error=payment_failed&status=${encodeURIComponent(status)}`)
  } catch (error) {
    console.error("[PAYU] callback fatal error", error)
    return htmlRedirect("/checkout?error=callback_failed")
  }
}

export async function GET() {
  return new NextResponse("PayU Callback Endpoint Active", { status: 200 })
}