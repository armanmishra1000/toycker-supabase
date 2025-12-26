export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"

import { retrieveCart } from "@lib/data/cart"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cacheBust = Number(searchParams.get("ts")) || undefined
  const cart = await retrieveCart(undefined, undefined, cacheBust)

  return NextResponse.json({ cart })
}
