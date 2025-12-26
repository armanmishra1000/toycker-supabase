import { NextResponse } from "next/server"
import { cookies } from "next/headers"

import { searchEntities } from "@lib/data/search"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") ?? ""
    const countryParam = searchParams.get("countryCode")
    const cookieCountry = (await cookies()).get("country_code")?.value
    const countryCode = countryParam || cookieCountry
    const productLimit = Number(searchParams.get("productLimit")) || 6
    const taxonomyLimit = Number(searchParams.get("taxonomyLimit")) || 5

    if (!query.trim()) {
      return NextResponse.json({
        products: [],
        categories: [],
        collections: [],
        suggestions: [],
      })
    }

    if (!countryCode) {
      return NextResponse.json(
        { message: "countryCode is required" },
        { status: 400 }
      )
    }

    const results = await searchEntities({
      query,
      countryCode,
      productLimit,
      taxonomyLimit,
    })

    return NextResponse.json(results, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
      },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load search results"
    return NextResponse.json({ message }, { status: 500 })
  }
}
