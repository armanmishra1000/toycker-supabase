import type { HttpTypes } from "@medusajs/types"

import {
  CATALOG_CARD_IMAGE_ALT_KEY,
  CATALOG_CARD_IMAGE_URL_KEY,
} from "@modules/catalog/constants"
import type { CatalogCardItem } from "@modules/catalog/types"

const FALLBACK_GRADIENTS = [
  "from-rose-100 via-rose-200 to-rose-100",
  "from-sky-100 via-sky-200 to-sky-100",
  "from-amber-100 via-amber-200 to-amber-100",
  "from-emerald-100 via-emerald-200 to-emerald-100",
  "from-indigo-100 via-indigo-200 to-indigo-100",
]

const getGradientForId = (seed: string) => {
  if (!seed) {
    return FALLBACK_GRADIENTS[0]
  }
  const index = Math.abs(
    seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  ) % FALLBACK_GRADIENTS.length

  return FALLBACK_GRADIENTS[index]
}

const extractCardImage = (entity?: { metadata?: Record<string, unknown> | null }) => {
  const metadata = entity?.metadata ?? undefined
  const src = (metadata?.[CATALOG_CARD_IMAGE_URL_KEY] as string | undefined) ?? undefined
  const alt = (metadata?.[CATALOG_CARD_IMAGE_ALT_KEY] as string | undefined) ?? undefined

  return src
    ? {
        src,
        alt: alt ?? null,
      }
    : undefined
}

export const buildCategoryCardItems = (
  categories: HttpTypes.StoreProductCategory[]
): CatalogCardItem[] => {
  const flattened = flattenCategories(categories)

  const unique = flattened.filter((category) => !!category.handle)

  return unique
    .map<CatalogCardItem>((category) => ({
      id: category.id,
      title: category.name,
      description: category.description ?? null,
      href: `/categories/${category.handle}`,
      image: extractCardImage(category),
      badge: category.parent_category ? category.parent_category.name : undefined,
    }))
    .sort((a, b) => a.title.localeCompare(b.title))
}

export const buildCollectionCardItems = (
  collections: HttpTypes.StoreCollection[]
): CatalogCardItem[] => {
  return collections
    .filter((collection) => {
      if (!collection.handle) {
        return false
      }

      const normalizedHandle = collection.handle.toLowerCase()
      if (normalizedHandle === "popular" || normalizedHandle === "best_selling") {
        return false
      }

      return true
    })
    .map<CatalogCardItem>((collection) => {
      const metadata = collection.metadata as Record<string, unknown> | null | undefined
      const featuredFlag = Boolean(metadata?.["featured"])
      const description = (collection as { description?: string | null }).description ?? null
      return {
        id: collection.id,
        title: collection.title,
        description,
        href: `/collections/${collection.handle}`,
        image: extractCardImage(collection),
        badge: featuredFlag ? "Featured" : undefined,
      }
    })
    .sort((a, b) => a.title.localeCompare(b.title))
}

const flattenCategories = (
  categories: HttpTypes.StoreProductCategory[]
) => {
  const map = new Map<string, HttpTypes.StoreProductCategory>()

  const visit = (category?: HttpTypes.StoreProductCategory | null) => {
    if (!category || map.has(category.id)) {
      return
    }

    map.set(category.id, category)

    category.category_children?.forEach((child) => visit(child))
  }

  categories.forEach((category) => visit(category))

  return Array.from(map.values())
}

export const buildPlaceholderStyles = (id: string) => {
  const gradientClass = getGradientForId(id)
  return `bg-gradient-to-br ${gradientClass}`
}
