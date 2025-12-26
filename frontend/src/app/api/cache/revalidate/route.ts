/* eslint-disable @next/next/no-img-element */
import { revalidatePath, revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

type RevalidatePayload = {
  tags?: unknown
  paths?: unknown
}

const HEADER_SECRET = "x-medusa-revalidate-secret"

const sanitizeList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0)
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
  }

  return []
}

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const sharedSecret = process.env.MEDUSA_REVALIDATE_SECRET ?? process.env.REVALIDATE_SECRET

  if (!sharedSecret) {
    return NextResponse.json(
      { message: "Revalidation secret is not configured" },
      { status: 500 }
    )
  }

  const providedSecret = request.headers.get(HEADER_SECRET)

  if (providedSecret !== sharedSecret) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  let payload: RevalidatePayload

  try {
    payload = (await request.json()) as RevalidatePayload
  } catch {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 })
  }

  const tags = sanitizeList(payload.tags)
  const paths = sanitizeList(payload.paths)

  if (!tags.length && !paths.length) {
    return NextResponse.json(
      { message: "No tags or paths provided" },
      { status: 400 }
    )
  }

  const dedupedTags = Array.from(new Set(tags))
  const dedupedPaths = Array.from(new Set(paths)).filter((path) => path.startsWith("/"))

  await Promise.all(dedupedTags.map((tag) => revalidateTag(tag)))
  await Promise.all(dedupedPaths.map((path) => revalidatePath(path)))

  return NextResponse.json({ tags: dedupedTags, paths: dedupedPaths })
}
