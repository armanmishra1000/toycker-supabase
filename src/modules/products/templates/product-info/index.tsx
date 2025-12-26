import { HttpTypes } from "@medusajs/types"
import { Heading } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SafeRichText from "@modules/common/components/safe-rich-text"
import getShortDescription from "@modules/products/utils/get-short-description"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  const shortDescription = getShortDescription(product, { fallbackToDescription: false })

  return (
    <div id="product-info">
      <div className="flex flex-col gap-y-4 lg:max-w-[500px] mx-auto">
        {product.collection && (
          <LocalizedClientLink
            href={`/collections/${product.collection.handle}`}
            className="text-medium text-ui-fg-muted hover:text-ui-fg-subtle"
          >
            {product.collection.title}
          </LocalizedClientLink>
        )}
        <Heading
          level="h2"
          className="text-3xl leading-10 text-ui-fg-base"
          data-testid="product-title"
        >
          {product.title}
        </Heading>

        {shortDescription ? ( 
          <p className="text-medium text-ui-fg-subtle" data-testid="product-description">
            {shortDescription}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export default ProductInfo
