import { getCollectionByHandle } from "@lib/data/collections"

const COLLECTION_ID_PATTERN = /^pcol_[a-z0-9]+$/i

const normalizeHandleInput = (value: string) => value.trim().replace(/^\/+|\/+$/g, "")

const splitHandle = (value: string) => {
  const normalized = normalizeHandleInput(value)
  const parts = normalized.split("/").filter(Boolean)

  if (parts[0]?.toLowerCase() === "categories" || parts[0]?.toLowerCase() === "collections") {
    return parts.slice(1)
  }

  return parts
}

export const resolveCollectionIdentifier = async (input?: string): Promise<string | undefined> => {
  const normalized = input?.trim()

  if (!normalized) {
    return undefined
  }

  if (COLLECTION_ID_PATTERN.test(normalized)) {
    return normalized
  }

  const segments = splitHandle(normalized)

  if (!segments.length) {
    return undefined
  }

  try {
    const collection = await getCollectionByHandle(segments.join("/"))
    return collection?.id
  } catch {
    return undefined
  }
}

export const extractCollectionHandleFromHref = (href: string) => {
  const normalized = href?.trim()

  if (!normalized) {
    return undefined
  }

  const parts = normalizeHandleInput(normalized).split("/").filter(Boolean)

  if (!parts.length) {
    return undefined
  }

  return parts[parts.length - 1]
}
