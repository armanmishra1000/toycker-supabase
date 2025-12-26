import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductPreview from "@modules/products/components/product-preview"
import { WishlistProvider } from "@modules/products/context/wishlist"
import { getCollectionProductsByHandle } from "@modules/home/lib/get-collection-products"

const POPULAR_COLLECTION_HANDLE = "popular"
const POPULAR_SECTION_LIMIT = 10

type PopularToySetProps = {
  regionId: string
  countryCode: string
  isCustomerLoggedIn: boolean
  collectionId?: string
}

const PopularToySet = async ({ regionId, countryCode, isCustomerLoggedIn, collectionId }: PopularToySetProps) => {
  const products = await getCollectionProductsByHandle({
    handle: POPULAR_COLLECTION_HANDLE,
    regionId,
    limit: POPULAR_SECTION_LIMIT,
    collectionId,
  })

  if (products.length === 0) {
    return null
  }

  const accountPath = "/account"

  return (
    <section
      className="w-full bg-primary/10"
      aria-labelledby="popular-toy-set-heading"
      data-testid="popular-toy-set"
    >
      <div className="mx-auto max-w-screen-2xl px-4 py-16 md:py-20">
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#c5996f]">
            Explore
          </p>
          <h2
            id="popular-toy-set-heading"
            className="mt-2 text-3xl font-bold text-[#1b2240] md:text-4xl"
          >
            Explore Popular Toy Set
          </h2>
          <p className="mt-3 text-base text-[#6b5b53] md:text-lg">
            Discover parent-approved sets that balance sensory fun, imaginative stories, and
            learning moments—all ready to ship.
          </p>
        </header>

        <div className="mt-12">
          <WishlistProvider isAuthenticated={isCustomerLoggedIn} loginPath={accountPath}>
            <ul className="mt-10 grid gap-6 grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 lg:[&>li:nth-last-child(-n+2)]:hidden xl:[&>li:nth-last-child(-n+2)]:block">
              {products.map((product) => (
                <li key={product.id}>
                  <ProductPreview product={product} viewMode="grid-4" />
                </li>
              ))}
            </ul>
          </WishlistProvider>

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
