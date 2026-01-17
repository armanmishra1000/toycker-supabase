import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          if (process.env.NODE_ENV === "development") {
            console.log("Proxy setAll cookies:", cookiesToSet.map(c => c.name))
          }
          cookiesToSet.forEach(({ name, value, options: _options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              path: '/',
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
            })
          )
        },
      },
    }
  )

  // Use getClaims() for secure local JWT validation with asymmetric keys
  // This validates the JWT locally without a network call, improving performance
  // while maintaining security through cryptographic signature verification
  const { data, error } = await supabase.auth.getClaims()
  const user = data?.claims?.sub ? { id: data.claims.sub } : null

  // Log validation errors in development for debugging
  if (error && process.env.NODE_ENV === "development") {
    console.warn("JWT validation error in proxy:", error.message)
  }

  // Early redirect for checkout if not authenticated
  if (request.nextUrl.pathname.startsWith('/checkout') && !user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('returnUrl', '/checkout?step=address')
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export async function proxy(request: NextRequest) {
  // CRITICAL: Bypass middleware for PayU callbacks to prevent auth errors on POST requests
  if (request.nextUrl.pathname.startsWith('/api/payu/callback')) {
    return NextResponse.next()
  }

  // Safety net removed as it causes issues with JS-based verification flow

  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/payu/callback (payment callback needs to be clean)
     * - api/auth/callback (Supabase auth callback)
     * - auth/confirm (email confirmation)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt, sitemap.xml (SEO files)
     * - assets (public assets folder)
     * - All static file extensions (images, fonts, manifests)
     */
    '/((?!api/payu/callback|api/auth/callback|auth/confirm|_next/static|_next/image|assets|favicon.ico|robots.txt|sitemap.xml|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|avif|woff|woff2|ttf|otf|eot|json)$).*)',
  ],
}