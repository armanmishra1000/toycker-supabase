import Breadcrumbs from "@modules/common/components/breadcrumbs"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import WishlistPageClient from "@modules/wishlist/components/wishlist-page-client"

type WishlistPageTemplateProps = {
  countryCode: string
  customerName: string
  loginPath: string
  isCustomerLoggedIn: boolean
}

const WishlistPageTemplate = ({
  countryCode,
  customerName,
  loginPath,
  isCustomerLoggedIn,
}: WishlistPageTemplateProps) => {
  return (
    <div className="content-container py-6 lg:py-10" data-testid="wishlist-page">
      <Breadcrumbs
        className="mb-6"
        items={[
          { label: "Store", href: "/store" },
          { label: "Wishlist" },
        ]}
      />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-ui-fg-muted">Wishlist</p>
          <h1 className="text-3xl font-semibold text-slate-900">Your saved toys, {customerName}</h1>
          <p className="mt-2 text-base text-slate-600">
            All the products you have hearted across the store live here. Add them to cart or keep saving for later.
          </p>
        </div>
        <LocalizedClientLink
          href="/store"
          className="inline-flex h-12 items-center justify-center rounded-full border border-slate-200 px-6 text-sm font-semibold text-slate-800 transition hover:border-slate-300"
        >
          Continue shopping
        </LocalizedClientLink>
      </div>
      <div className="mt-8">
        <WishlistPageClient
          countryCode={countryCode}
          loginPath={loginPath}
          isCustomerLoggedIn={isCustomerLoggedIn}
        />
      </div>
    </div>
  )
}

export default WishlistPageTemplate
