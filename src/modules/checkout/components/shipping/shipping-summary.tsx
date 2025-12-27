import { convertToLocale } from "@lib/util/money"
import { Text } from "@modules/common/components/text"

type ShippingSummaryProps = {
  cart: any
  availableShippingMethods: any[] | null
  calculatedPricesMap: Record<string, number>
}

const ShippingSummary = ({
  cart,
  availableShippingMethods,
  calculatedPricesMap,
}: ShippingSummaryProps) => {
  const currencyCode = cart.currency_code || cart.region?.currency_code || "INR"

  return (
    <div className="text-sm">
      {cart && (cart.shipping_methods?.length ?? 0) > 0 ? (
        <div className="flex flex-col w-1/3">
          <Text weight="bold" className="text-sm text-gray-900 mb-1">
            Method
          </Text>
          <Text className="text-sm text-gray-500">
            {(() => {
              const shippingMethod = cart.shipping_methods!.at(-1)!

              // First priority: Try to use the shipping method's total field (includes tax)
              if ((shippingMethod.total ?? 0) > 0) {
                return (
                  <>
                    {shippingMethod.name}{" "}
                    {convertToLocale({
                      amount: shippingMethod.total ?? 0,
                      currency_code: currencyCode,
                    })}
                  </>
                )
              }

              // Second priority: Try to use the shipping method's subtotal field (excludes tax)
              if ((shippingMethod.subtotal ?? 0) > 0) {
                return (
                  <>
                    {shippingMethod.name}{" "}
                    {convertToLocale({
                      amount: shippingMethod.subtotal ?? 0,
                      currency_code: currencyCode,
                    })}
                  </>
                )
              }

              // Third priority: If cart data is 0, try to get price from available shipping options
              if (availableShippingMethods?.length) {
                const matchedOption = availableShippingMethods.find(
                  (opt) => opt.id === shippingMethod.shipping_option_id
                )
                if (
                  matchedOption &&
                  matchedOption.price_type === "flat" &&
                  matchedOption.amount
                ) {
                  return (
                    <>
                      {shippingMethod.name}{" "}
                      {convertToLocale({
                        amount: matchedOption.amount,
                        currency_code: currencyCode,
                      })}
                    </>
                  )
                }
                // For calculated prices, check the calculatedPricesMap
                if (
                  matchedOption &&
                  matchedOption.price_type === "calculated"
                ) {
                  const calculatedAmount = calculatedPricesMap[matchedOption.id]
                  if (calculatedAmount != null) {
                    return (
                      <>
                        {shippingMethod.name}{" "}
                        {convertToLocale({
                          amount: calculatedAmount,
                          currency_code: currencyCode,
                        })}
                      </>
                    )
                  }
                }
              }

              // Default: show 0
              return (
                <>
                  {shippingMethod.name}{" "}
                  {convertToLocale({
                    amount: 0,
                    currency_code: currencyCode,
                  })}
                </>
              )
            })()}
          </Text>
        </div>
      ) : cart?.shipping_address ? (
        <div className="flex flex-col gap-y-4">
          <div className="w-48 h-10 bg-gray-200 animate-pulse rounded" />
          <div className="w-64 h-6 bg-gray-200 animate-pulse rounded" />
        </div>
      ) : null}
    </div>
  )
}

export default ShippingSummary