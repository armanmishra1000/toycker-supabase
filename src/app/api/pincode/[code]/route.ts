import { NextResponse } from "next/server"

interface PostOffice {
  Name: string
  District: string
  State: string
  Block: string
  BranchType: string
  DeliveryStatus: string
  Circle: string
  Division: string
  Region: string
  Country: string
  Pincode: string
}

interface PostalApiResponse {
  Status: string
  Message: string
  PostOffice: PostOffice[] | null
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  // Validate: exactly 6 digits, first digit 1-9
  if (!/^[1-9][0-9]{5}$/.test(code)) {
    return NextResponse.json(
      { error: "Invalid pincode format" },
      { status: 400 }
    )
  }

  try {
    const response = await fetch(
      `https://api.postalpincode.in/pincode/${code}`,
      { next: { revalidate: 86400 } } // Cache for 24 hours (pincodes don't change)
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: "Pincode service unavailable" },
        { status: 502 }
      )
    }

    const data: PostalApiResponse[] = await response.json()
    const result = data[0]

    if (result.Status !== "Success" || !result.PostOffice?.length) {
      return NextResponse.json(
        { error: "Pincode not found" },
        { status: 404 }
      )
    }

    const postOffice = result.PostOffice[0]

    return NextResponse.json({
      city: postOffice.District,
      state: postOffice.State,
    })
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch pincode data" },
      { status: 500 }
    )
  }
}
