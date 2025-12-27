import { Product } from "@/lib/supabase/types"
import { extractPlainText } from "@lib/util/sanitize-html"

type ShortDescriptionCarrier = Product & {
  short_description?: string | null
}

export const getShortDescription = (
  product: ShortDescriptionCarrier,
  options: { fallbackToDescription?: boolean } = { fallbackToDescription: true }
) => {
  const { fallbackToDescription = true } = options
  const metadataValue = (() => {
    const source = product.metadata as Record<string, unknown> | null | undefined

    if (!source) {
      return ""
    }

    const candidate = source["short_description"]
    if (typeof candidate === "string") {
      return candidate.trim()
    }

    return ""
  })()

  if (metadataValue) {
    return metadataValue
  }

  const fromShortDescription = product.short_description?.trim()
  if (fromShortDescription) {
    return fromShortDescription
  }

  const fromSubtitle = product.subtitle?.trim()
  if (fromSubtitle) {
    return fromSubtitle
  }

  if (fallbackToDescription) {
    const fromDescription = extractPlainText(product.description)?.trim()
    if (fromDescription) {
      return fromDescription
    }
  }

  return ""
}

export default getShortDescription