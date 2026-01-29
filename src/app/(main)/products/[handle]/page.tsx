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

  const seoTitle = product.seo_title || `${product.name} | Toycker Store`
  const seoDescription = product.seo_description || product.name || ""
  const keywords = (product.seo_metadata?.keywords as string) || ""
  const ogTitle = (product.seo_metadata?.og_title as string) || seoTitle
  const ogDescription = (product.seo_metadata?.og_description as string) || seoDescription
  const noIndex = product.seo_metadata?.no_index === true

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: keywords,
    robots: {
      index: !noIndex,
      follow: !noIndex,
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      images: product.image_url ? [product.image_url] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
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