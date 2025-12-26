import { NextResponse } from "next/server"
import { cookies } from "next/headers"

import { isImageSearchEnabled, searchByImage } from "@lib/data/image-search"

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const countryParam = searchParams.get("countryCode")
    const cookieCountry = (await cookies()).get("country_code")?.value
    const countryCode = countryParam || cookieCountry
    const limit = Number(searchParams.get("limit")) || 6

    if (!countryCode) {
      return NextResponse.json({ message: "countryCode is required" }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "file is required" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    if (!isImageSearchEnabled) {
      return NextResponse.json(
        { message: "Image search provider not configured", products: [], categories: [], collections: [], suggestions: [] },
        { status: 501 }
      )
    }

    const results = await searchByImage({ fileBuffer: buffer, countryCode, limit })

    return NextResponse.json(results, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
      },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process image search"
    return NextResponse.json({ message }, { status: 500 })
  }
}
