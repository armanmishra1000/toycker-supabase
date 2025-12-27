import "server-only"
import { cookies as nextCookies } from "next/headers"

export const getCacheTag = async (tag: string): Promise<string> => {
  return tag
}

export const getCacheOptions = async (
  tag: string,
  options?: {
    globalTag?: string
  }
): Promise<{ tags: string[] } | Record<string, never>> => {
  if (typeof window !== "undefined") {
    return {}
  }

  const cacheTag = await getCacheTag(tag)
  const globalTag = options?.globalTag ?? tag

  const tags = new Set<string>()

  if (globalTag) {
    tags.add(globalTag)
  }

  if (cacheTag) {
    tags.add(cacheTag)
  }

  if (!tags.size) {
    return {}
  }

  return { tags: Array.from(tags) }
}

export const getCartId = async () => {
  const cookies = await nextCookies()
  return cookies.get("toycker_cart_id")?.value
}

export const setCartId = async (cartId: string) => {
  const cookies = await nextCookies()
  cookies.set("toycker_cart_id", cartId, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
}

export const removeCartId = async () => {
  const cookies = await nextCookies()
  cookies.set("toycker_cart_id", "", {
    maxAge: -1,
  })
}