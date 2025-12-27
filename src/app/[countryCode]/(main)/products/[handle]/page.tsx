import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getProductByHandle, listProducts } from "@lib/data/products"
import { getRegion, listRegions } from "@lib/data/regions"
import ProductTemplate from "@modules/products/templates"
import { Product } from "@/lib/supabase/types"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
  searchParams: Promise<{ v_id?: string }>
}

export async function generateStaticParams() {
  try {
    const countryCodes = await listRegions().then((regions) =>
      regions?.map((r) => r.countries?.map((c) => c.id)).flat()
    )

    if (!countryCodes) {
      return []
    }

    const products = await listProducts()

    return countryCodes
      .flatMap((country) =>
        products.map((product) => ({
          countryCode: country,
          handle: product.handle,
        }))
      )
      .filter((param) => param.handle)
  } catch (error) {
    console.error(
      `Failed to generate static paths for product pages: ${
        error instanceof Error ? error.message : "Unknown error"
      }.`
    )
    return []
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { handle } = params
  const [region, product] = await Promise.all([
    getRegion(params.countryCode),
    getProductByHandle(handle),
  ])

  if (!region || !product) {
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

export default async function ProductPage(props: Props) {
  const params = await props.params
  const [region, product] = await Promise.all([
    getRegion(params.countryCode),
    getProductByHandle(params.handle),
  ])

  if (!region || !product) {
    notFound()
  }

  const images = product.images ? product.images.map(url => ({ url })) : []

  return (
    <ProductTemplate
      product={product}
      region={region}
      countryCode={params.countryCode}
      images={images as any}
    />
  )
}
