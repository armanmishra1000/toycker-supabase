export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"

import { retrieveCart } from "@lib/data/cart"

export async function GET(_request: Request) {

  const cart = await retrieveCart()

  return NextResponse.json({ cart })
}
