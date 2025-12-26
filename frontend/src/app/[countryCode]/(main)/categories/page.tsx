import type { Metadata } from "next"

import { listCategories } from "@lib/data/categories"
import CatalogLanding from "@modules/catalog/components/catalog-landing"
import { buildCategoryCardItems } from "@modules/catalog/utils/catalog-items"

export const metadata: Metadata = {
  title: "Browse categories",
  description: "Explore every toy category in one place.",
}

type PageProps = {
  params: Promise<{ countryCode: string }>
}

export default async function CategoriesLandingPage({ params }: PageProps) {
  await params

  const categories = await listCategories()
  const items = buildCategoryCardItems(categories ?? [])

  return (
    <CatalogLanding
      title="Shop by category"
      subtitle="Pick a category below to dive into curated assortments."
      breadcrumbs={[
        { label: "Store", href: "/store" },
        { label: "Categories" },
      ]}
      items={items}
    />
  )
}
