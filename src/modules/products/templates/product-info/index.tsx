import { Text } from "@modules/common/components/text"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SafeRichText from "@modules/common/components/safe-rich-text"
import getShortDescription from "@modules/products/utils/get-short-description"

type ProductInfoProps = {
  product: any
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  const shortDescription = getShortDescription(product, { fallbackToDescription: false })

  return (
    <div id="product-info">
      <div className="flex flex-col gap-y-4 lg:max-w-[500px] mx-auto">
        {product.collection && (
          <LocalizedClientLink
            href={`/collections/${product.collection.handle}`}
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            {product.collection.title}
          </LocalizedClientLink>
        )}
        <Text
          as="h1"
          weight="bold"
          className="text-3xl leading-10 text-gray-900"
          data-testid="product-title"
        >
          {product.title}
        </Text>

        {shortDescription ? ( 
          <p className="text-sm text-gray-500" data-testid="product-description">
            {shortDescription}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export default ProductInfo
