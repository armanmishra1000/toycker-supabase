import { Metadata } from "next"
import { notFound } from "next/navigation"
import { listProducts } from "@lib/data/products"
import { getRegion, listRegions } from "@lib/data/regions"
import ProductTemplate from "@modules/products/templates"
import { HttpTypes } from "@medusajs/types"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
  searchParams: Promise<{ v_id?: string }>
}

export async function generateStaticParams() {
  try {
    const countryCodes = await listRegions().then((regions) =>
      regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
    )

    if (!countryCodes) {
      return []
    }

    const promises = countryCodes.map(async (country) => {
      const { response } = await listProducts({
        countryCode: country,
        queryParams: { limit: 100, fields: "handle" },
      })

      return {
        country,
        products: response.products,
      }
    })

    const countryProducts = await Promise.all(promises)

    return countryProducts
      .flatMap((countryData) =>
        countryData.products.map((product) => ({
          countryCode: countryData.country,
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

type VariantWithImages = HttpTypes.StoreProductVariant & {
  images?: HttpTypes.StoreProductImage[] | null
}

function getImagesForVariant(
  product?: HttpTypes.StoreProduct,
  selectedVariantId?: string
): HttpTypes.StoreProductImage[] {
  if (!product) {
    return []
  }

  const allImages: HttpTypes.StoreProductImage[] = product.images ?? []

  if (!selectedVariantId || !product.variants?.length) {
    return allImages
  }

  const variant = product.variants.find(
    (v) => v.id === selectedVariantId
  ) as VariantWithImages | undefined

  const variantImages: HttpTypes.StoreProductImage[] = variant?.images ?? []

  if (!variant || variantImages.length === 0) {
    return allImages
  }

  const imageIdsMap = new Map(
    variantImages.map((image) => [image.id, true] as const)
  )
  return allImages.filter((image) => imageIdsMap.has(image.id))
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { handle } = params
  const [region, product] = await Promise.all([
    getRegion(params.countryCode),
    listProducts({
      countryCode: params.countryCode,
      queryParams: { handle },
    }).then(({ response }) => response.products[0]),
  ])

  if (!region || !product) {
    notFound()
  }

  return {
    title: `${product.title} | Toycker Store`,
    description: `${product.title}`,
    openGraph: {
      title: `${product.title} | Toycker Store`,
      description: `${product.title}`,
      images: product.thumbnail ? [product.thumbnail] : [],
    },
  }
}

export default async function ProductPage(props: Props) {
  const params = await props.params
  const searchParams = await props.searchParams

  const selectedVariantId = searchParams.v_id

  const [region, pricedProduct] = await Promise.all([
    getRegion(params.countryCode),
    listProducts({
      countryCode: params.countryCode,
      queryParams: { handle: params.handle },
    }).then(({ response }) => response.products[0]),
  ])

  const images = getImagesForVariant(pricedProduct, selectedVariantId)

  if (!region || !pricedProduct) {
    notFound()
  }

  return (
    <ProductTemplate
      product={pricedProduct}
      region={region}
      countryCode={params.countryCode}
      images={images ?? []}
    />
  )
}
