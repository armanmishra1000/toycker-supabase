import type { Metadata } from "next"

import { listCollections } from "@lib/data/collections"
import CatalogLanding from "@modules/catalog/components/catalog-landing"
import { buildCollectionCardItems } from "@modules/catalog/utils/catalog-items"

export const metadata: Metadata = {
  title: "Collections",
  description: "Discover themed collections built for every age and play style.",
}

type PageProps = {
  params: Promise<{ countryCode: string }>
}

export default async function CollectionsLandingPage({ params }: PageProps) {
  await params

  const { collections } = await listCollections()
  const items = buildCollectionCardItems(collections ?? [])

  return (
    <CatalogLanding
      title="Shop by collection"
      subtitle="Follow curated drops, seasonal edits, and evergreen fan favorites."
      breadcrumbs={[
        { label: "Store", href: "/store" },
        { label: "Collections" },
      ]}
      items={items}
    />
  )
}
