import { DEFAULT_COUNTRY_CODE } from "./lib/constants/region"
import { NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // Skip static assets
  if (pathname.includes(".")) {
    return NextResponse.next()
  }

  const pathSegments = pathname.split("/").filter(Boolean)
  const countrySegment = pathSegments[0]
  const normalizedDefault = DEFAULT_COUNTRY_CODE.toLowerCase()
  const hasCountryPrefix = Boolean(countrySegment && countrySegment.length === 2)

  const pathWithoutPrefix = hasCountryPrefix
    ? `/${pathSegments.slice(1).join("/")}` || "/"
    : pathname || "/"

  // If a country prefix exists in the URL, strip it from the visible URL.
  if (hasCountryPrefix) {
    const cleanUrl = new URL(pathWithoutPrefix + search, request.url)
    return NextResponse.redirect(cleanUrl, 307)
  }

  const internalPath = `/${normalizedDefault}${pathWithoutPrefix === "/" ? "" : pathWithoutPrefix}`
  const rewrittenUrl = new URL(internalPath + search, request.url)

  return NextResponse.rewrite(rewrittenUrl)
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp).*)",
  ],
}
