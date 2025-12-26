export const RECENTLY_VIEWED_KEY = "toycker_recently_viewed"
const MAX_RECENT_ITEMS = 12

export const getRecentlyViewedIds = (): string[] => {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const raw = window.localStorage.getItem(RECENTLY_VIEWED_KEY)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed.filter((id): id is string => typeof id === "string")) : []
  } catch {
    return []
  }
}

export const addRecentlyViewedId = (productId: string): void => {
  if (typeof window === "undefined") {
    return
  }

  const normalized = productId.trim()
  if (!normalized) {
    return
  }

  const existing = getRecentlyViewedIds().filter((id) => id !== normalized)
  const next = [normalized, ...existing].slice(0, MAX_RECENT_ITEMS)

  try {
    window.localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next))
  } catch {
    // Ignore storage quota errors for now
  }
}
