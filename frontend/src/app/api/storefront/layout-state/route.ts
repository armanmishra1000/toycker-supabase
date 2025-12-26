import { NextResponse } from "next/server"

import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const [customer, cart] = await Promise.all([retrieveCustomer(), retrieveCart()])

    return NextResponse.json({ customer, cart })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load layout state"
    return NextResponse.json({ message }, { status: 500 })
  }
}
