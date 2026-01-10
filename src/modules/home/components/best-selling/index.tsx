import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductPreview from "@modules/products/components/product-preview"
import { getCollectionProductsByHandle } from "@modules/home/lib/get-collection-products"

const BEST_SELLING_COLLECTION_HANDLE = "best-selling"
const BEST_SELLING_SECTION_LIMIT = 10

import { getRegion } from "@lib/data/regions"
import { getClubSettings } from "@lib/data/club"

type BestSellingProps = {
  collectionId?: string
}

const BestSelling = async ({ collectionId }: BestSellingProps) => {
  const [region, clubSettings] = await Promise.all([
    getRegion(),
    getClubSettings(),
  ])

  const products = await getCollectionProductsByHandle({
    handle: BEST_SELLING_COLLECTION_HANDLE,
    regionId: region.id,
    limit: BEST_SELLING_SECTION_LIMIT,
    collectionId,
  })

  const clubDiscountPercentage = clubSettings.discount_percentage

  if (products.length === 0) {
    return null
  }

  return (
    <section
      className="w-full bg-white"
      aria-labelledby="best-selling-heading"
      data-testid="best-selling-section"
    >
      <div className="mx-auto max-w-screen-2xl px-4 pt-16 pb-10 md:pt-20 md:pb-10">
        <div className="flex flex-col gap-4 text-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Curated</p>
            <h2
              id="best-selling-heading"
              className="mt-2 text-3xl font-bold text-[#1b2240] md:text-4xl"
            >
              Best Selling Picks
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-[#6b5b53] md:text-lg">
              Spotlight on the sets parents keep returning to—reliable builds, imaginative stories,
              and quality that keeps kids exploring.
            </p>
          </div>
        </div>

        <ul className="mt-10 grid gap-6 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 lg:[&>li:nth-last-child(-n+2)]:hidden xl:[&>li:nth-last-child(-n+2)]:block">
          {products.map((product) => (
            <li key={product.id}>
              <ProductPreview
                product={product}
                viewMode="grid-5"
                clubDiscountPercentage={clubDiscountPercentage}
              />
            </li>
          ))}
        </ul>

        <div className="mt-10 text-center">
          <LocalizedClientLink
            href="/store"
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2 text-sm font-semibold uppercase tracking-wide text-white shadow hover:bg-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Load more
          </LocalizedClientLink>
        </div>
      </div>
    </section>
  )
}

export default BestSelling
