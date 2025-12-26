import { getCategoryByHandle } from "@lib/data/categories"

const CATEGORY_ID_PATTERN = /^pcat_[a-z0-9]+$/i

const normalizeHandleInput = (value: string) => value.trim().replace(/^\/+|\/+$/g, "")

const splitHandle = (value: string) => {
  const parts = normalizeHandleInput(value).split("/").filter(Boolean)

  if (parts[0]?.toLowerCase() === "categories") {
    return parts.slice(1)
  }

  return parts
}

export const resolveCategoryIdentifier = async (input?: string): Promise<string | undefined> => {
  const normalized = input?.trim()

  if (!normalized) {
    return undefined
  }

  if (CATEGORY_ID_PATTERN.test(normalized)) {
    return normalized
  }

  const segments = splitHandle(normalized)

  if (!segments.length) {
    return undefined
  }

  try {
    const category = await getCategoryByHandle(segments)
    return category?.id
  } catch {
    return undefined
  }
}
