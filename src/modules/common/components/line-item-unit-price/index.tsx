import { convertToLocale } from "@lib/util/money"
import { cn } from "@lib/util/cn"

type LineItemUnitPriceProps = {
  item: any
  style?: "default" | "tight"
  currencyCode: string
}

const LineItemUnitPrice = ({
  item,
  style = "default",
  currencyCode,
}: LineItemUnitPriceProps) => {
  const { total, original_total, quantity } = item
  const safeQuantity = quantity && quantity > 0 ? quantity : 1
  const normalizedTotal = total ?? 0
  const normalizedOriginal = original_total ?? normalizedTotal
  const hasReducedPrice = normalizedTotal < normalizedOriginal

  const percentage_diff = normalizedOriginal
    ? Math.round(((normalizedOriginal - normalizedTotal) / normalizedOriginal) * 100)
    : 0

  return (
    <div className="flex flex-col text-gray-400 justify-center h-full">
      {hasReducedPrice && (
        <>
          <p>
            {style === "default" && (
              <span className="text-gray-400">Original: </span>
            )}
            <span
              className="line-through"
              data-testid="product-unit-original-price"
            >
              {convertToLocale({
                amount: normalizedOriginal / safeQuantity,
                currency_code: currencyCode,
              })}
            </span>
          </p>
          {style === "default" && (
            <span className="text-blue-600">-{percentage_diff}%</span>
          )}
        </>
      )}
      <span
        className={cn("text-base", {
          "text-blue-600": hasReducedPrice,
        })}
        data-testid="product-unit-price"
      >
        {convertToLocale({
            amount: normalizedTotal / safeQuantity,
          currency_code: currencyCode,
        })}
      </span>
    </div>
  )
}

export default LineItemUnitPrice
