export type GiftWrapLineMetadata = {
  gift_wrap_line: true
  parent_line_id: string
}

export const isGiftWrapLine = (
  metadata: unknown
): metadata is GiftWrapLineMetadata => {
  if (!metadata || typeof metadata !== "object") {
    return false
  }

  const data = metadata as Record<string, unknown>
  return data.gift_wrap_line === true && typeof data.parent_line_id === "string"
}
