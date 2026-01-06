import { NextRequest, NextResponse } from "next/server"
import { searchByImage, isImageSearchEnabled } from "@/lib/data/image-search"

export async function POST(req: NextRequest) {
  if (!isImageSearchEnabled) {
    return NextResponse.json({ error: "Image search is disabled" }, { status: 403 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    const countryCode = req.nextUrl.searchParams.get("countryCode") || "IN"
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "6")

    const buffer = Buffer.from(await file.arrayBuffer())

    const results = await searchByImage({
      fileBuffer: buffer,
      countryCode,
      limit,
    })

    return NextResponse.json(results)
  } catch (error) {
    console.error("Image search API error:", error)
    return NextResponse.json(
      { error: "Internal server error during image search" },
      { status: 500 }
    )
  }
}
