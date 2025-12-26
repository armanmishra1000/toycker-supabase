import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    await request.text()
  } catch (error) {
    console.error("Failed to read telemetry payload", error)
  }

  return new NextResponse(null, { status: 204 })
}
