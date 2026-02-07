import { NextRequest, NextResponse } from "next/server"

import { setCartId } from "@lib/data/cookies"

export const dynamic = "force-dynamic"

const DEFAULT_NEXT_PATH = "/checkout?step=address"

const resolveNextPath = (value: string | null): string => {
  if (!value || !value.startsWith("/")) {
    return DEFAULT_NEXT_PATH
  }

  return value
}

export async function GET(request: NextRequest) {
  const cartId = request.nextUrl.searchParams.get("cartId")
  const nextPath = resolveNextPath(request.nextUrl.searchParams.get("next"))

  if (!cartId || cartId.trim().length === 0) {
    return NextResponse.redirect(new URL(DEFAULT_NEXT_PATH, request.url))
  }

  await setCartId(cartId)
  return NextResponse.redirect(new URL(nextPath, request.url))
}
