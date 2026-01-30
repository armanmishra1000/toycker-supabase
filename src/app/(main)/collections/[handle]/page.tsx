import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCollectionByHandle, listCollections, Collection } from "@lib/data/collections"
import CollectionTemplate from "@modules/collections/templates"
import { SortOptions } from "@modules/store/components/refinement-list/types"
import { getClubSettings } from "@lib/data/club"

type Props = {
  params: Promise<{ handle: string }>
  searchParams: Promise<{
    page?: string
    sortBy?: SortOptions
    view?: string
  }>
}

export const PRODUCT_LIMIT = 12
export const dynamic = "force-dynamic"

export async function generateStaticParams() {
  const { collections } = await listCollections()

  if (!collections) {
    return []
  }

  return collections.map((collection: Collection) => ({
    handle: collection.handle,
  }))
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const collection = await getCollectionByHandle(params.handle)

  if (!collection) {
    notFound()
  }

  return {
    title: `${collection.title} | Toycker Store`,
    description: `${collection.title} collection`,
  }
}

export default async function CollectionPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
  const { sortBy, page, view } = searchParams

  const collection = await getCollectionByHandle(params.handle)

  if (!collection) {
    notFound()
  }

  const clubSettings = await getClubSettings()

  return (
    <CollectionTemplate
      collection={collection}
      page={page}
      sortBy={sortBy}
      viewMode={view as any}
      countryCode="in"
      clubDiscountPercentage={clubSettings?.discount_percentage}
    />
  )
}