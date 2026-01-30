import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCategoryByHandle, listCategories } from "@lib/data/categories"
import CategoryTemplate from "@modules/categories/templates"
import { SortOptions } from "@modules/store/components/refinement-list/types"
import { getClubSettings } from "@lib/data/club"

type Props = {
  params: Promise<{ category: string[] }>
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
    view?: string
  }>
}

export const revalidate = 60

export async function generateStaticParams() {
  const product_categories = await listCategories()

  if (!product_categories) {
    return []
  }

  const categoryHandles = product_categories.map(
    (category: any) => category.handle
  )

  return categoryHandles.map((handle: any) => ({
    category: [handle],
  }))
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  try {
    const productCategory = await getCategoryByHandle(params.category)

    if (!productCategory) {
      notFound()
    }

    const title = productCategory.name + " | Toycker Store"

    const description = productCategory.description ?? `${title} category.`

    return {
      title: `${title} | Toycker Store`,
      description,
      alternates: {
        canonical: `${params.category.join("/")}`,
      },
    }
  } catch (error) {
    notFound()
  }
}

export default async function CategoryPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
  const { sortBy, page, view } = searchParams

  const productCategory = await getCategoryByHandle(params.category)

  if (!productCategory) {
    notFound()
  }

  const clubSettings = await getClubSettings()

  return (
    <CategoryTemplate
      category={productCategory}
      sortBy={sortBy}
      page={page}
      viewMode={view as any}
      countryCode="in"
      clubDiscountPercentage={clubSettings?.discount_percentage}
    />
  )
}