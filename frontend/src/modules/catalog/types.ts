export type CatalogCardItem = {
  id: string
  title: string
  description?: string | null
  href: string
  badge?: string
  image?: {
    src: string
    alt?: string | null
  }
}

export type CatalogViewMode = "grid-4" | "grid-5"
