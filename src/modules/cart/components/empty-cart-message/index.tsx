import { Text } from "@modules/common/components/text"
import InteractiveLink from "@modules/common/components/interactive-link"

const EmptyCartMessage = () => {
  return (
    <div className="py-48 px-2 flex flex-col justify-center items-start" data-testid="empty-cart-message">
      <Text
        as="h1"
        weight="bold"
        className="flex flex-row text-3xl gap-x-2 items-baseline"
      >
        Cart
      </Text>
      <Text className="text-base mt-4 mb-6 max-w-[32rem] text-gray-500">
        You don&apos;t have anything in your cart. Let&apos;s change that, use
        the link below to start browsing our products.
      </Text>
      <div>
        <InteractiveLink href="/store">Explore products</InteractiveLink>
      </div>
    </div>
  )
}

export default EmptyCartMessage
