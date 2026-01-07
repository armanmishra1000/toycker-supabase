import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const host = request.headers.get("host")
  const rawCookies = request.cookies.getAll()

  console.log("Auth callback triggered:", {
    host,
    origin,
    path: new URL(request.url).pathname,
    rawCookies: rawCookies.map(c => c.name)
  })

  const code = searchParams.get("code")
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as "signup" | "invite" | "magiclink" | "recovery" | "email_change" | "email" | null

  // if "next" is in search params, use it as the redirection URL
  const next = searchParams.get("next") ?? "/account"

  if (code || token_hash) {
    const cookieStore = await cookies()
    console.log("Auth callback cookieStore cookies:", cookieStore.getAll().map(c => c.name))

    // Create supabase client with cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, {
                  ...options,
                  path: '/',
                  secure: process.env.NODE_ENV === 'production',
                  sameSite: 'lax',
                })
              )
            } catch (err) { /* ... */ }
          },
        },
      }
    )

    let error = null
    if (code) {
      console.log("Exchanging code for session...")
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      error = exchangeError
    } else if (token_hash && type) {
      console.log("Verifying OTP with token_hash...")
      const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash, type: type as any })
      error = verifyError
    }

    if (error) {
      console.error("Auth callback error:", error.message)

      // If error occurs, check if user is ALREADY confirmed/logged in
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        console.log("Auth callback: Session found despite error. Redirecting to:", next)
        return NextResponse.redirect(`${origin}${next}`)
      }

      return NextResponse.redirect(`${origin}/account?auth_error=invaild_or_expired_link`)
    } else {
      console.log("Auth callback successful, redirecting to:", next)
      const forwardedHost = request.headers.get("x-forwarded-host") // auth providers may use this
      const isLocalEnv = process.env.NODE_ENV === "development"
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  console.log("Auth callback failed: No code/token or result in error page.")
  // return the user to an error page with instructions
  const errorUrl = new URL(next, origin) // Usually /account
  errorUrl.searchParams.set('auth_error', 'invaild_or_expired_link')
  return NextResponse.redirect(errorUrl)
}
