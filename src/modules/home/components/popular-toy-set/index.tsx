import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductPreview from "@modules/products/components/product-preview"
import { getCollectionProductsByHandle } from "@modules/home/lib/get-collection-products"

const POPULAR_COLLECTION_HANDLE = "popular"
const POPULAR_SECTION_LIMIT = 10

import { getRegion } from "@lib/data/regions"
import { getClubSettings } from "@lib/data/club"

type PopularToySetProps = {
  collectionId?: string
}

const PopularToySet = async ({ collectionId }: PopularToySetProps) => {
  const [region, clubSettings] = await Promise.all([
    getRegion(),
    getClubSettings(),
  ])

  const products = await getCollectionProductsByHandle({
    handle: POPULAR_COLLECTION_HANDLE,
    regionId: region.id,
    limit: POPULAR_SECTION_LIMIT,
    collectionId,
  })

  const clubDiscountPercentage = clubSettings.discount_percentage

  if (products.length === 0) {
    return null
  }

  return (
    <section
      className="w-full bg-primary/10"
      aria-labelledby="popular-toy-set-heading"
      data-testid="popular-toy-set"
    >
      <div className="mx-auto max-w-screen-2xl px-4 pb-16 pt-10 md:pb-20 md:pt-10">
        <header className="mx-auto space-y-3 max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#c5996f]">
            Explore
          </p>
          <h2
            id="popular-toy-set-heading"
            className="text-2xl font-bold text-[#1b2240] md:text-4xl"
          >
            Explore Popular Toy Set
          </h2>
          <p className="text-base text-[#6b5b53] md:text-lg">
            Smart, Fun & Creative Toys for Every Little Adventure
          </p>
        </header> 

        <div className="mt-12">
          <ul className="mt-10 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 lg:[&>li:nth-last-child(-n+2)]:hidden xl:[&>li:nth-last-child(-n+2)]:block">
            {products.map((product) => (
              <li key={product.id}>
                <ProductPreview
                  product={product}
                  viewMode="grid-4"
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
      </div>
    </section>
  )
}

export default PopularToySet
