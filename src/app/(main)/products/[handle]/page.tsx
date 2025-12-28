import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getProductByHandle, listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ProductTemplate from "@modules/products/templates"

type Props = {
  params: Promise<{ handle: string }>
}

export const revalidate = 60

export async function generateStaticParams() {
  try {
    const { response: { products } } = await listProducts()
    return products.map((product) => ({
      handle: product.handle,
    }))
  } catch (error) {
    console.error(
      `Failed to generate static paths for product pages: ${error instanceof Error ? error.message : "Unknown error"
      }.`
    )
    return []
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { handle } = params
  const product = await getProductByHandle(handle)

  if (!product) {
    notFound()
  }

  return {
    title: `${product.name} | Toycker Store`,
    description: `${product.name}`,
    openGraph: {
      title: `${product.name} | Toycker Store`,
      description: `${product.name}`,
      images: product.image_url ? [product.image_url] : [],
    },
  }
}

import { getClubSettings } from "@lib/data/club"

export default async function ProductPage(props: Props) {
  const params = await props.params
  const [region, product, clubSettings] = await Promise.all([
    getRegion(),
    getProductByHandle(params.handle),
    getClubSettings(),
  ])

  if (!region || !product) {
    notFound()
  }

  const images = product.images ? product.images.map(url => ({ url })) : []

  return (
    <ProductTemplate
      product={product}
      region={region}
      countryCode="in"
      images={images as any}
      clubDiscountPercentage={clubSettings?.discount_percentage}
    />
  )
}