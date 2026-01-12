import { Radio } from "@headlessui/react"
import { Loader2 } from "lucide-react"
import { cn } from "@lib/util/cn"
import RadioComponent from "@modules/common/components/radio"
import { convertToLocale } from "@lib/util/money"

type ShippingMethodOptionProps = {
  option: any
  selectedId: string | null
  currencyCode: string
  price?: number | null
  isLoadingPrice?: boolean
  disabled?: boolean
  addressDisplay?: string
  isPickup?: boolean
}

const ShippingMethodOption = ({
  option,
  selectedId,
  currencyCode,
  price,
  isLoadingPrice,
  disabled,
  addressDisplay,
  isPickup: _isPickup,
}: ShippingMethodOptionProps) => {
  return (
    <Radio
      value={option.id}
      disabled={disabled}
      data-testid="delivery-option-radio"
      className={cn(
        "flex items-center justify-between text-sm cursor-pointer py-4 border rounded-lg px-8 mb-2 hover:shadow-sm transition-all",
        {
          "border-blue-600 ": option.id === selectedId,
          "cursor-not-allowed opacity-50": disabled,
        }
      )}
    >
      <div className="flex items-start gap-x-4">
        <RadioComponent checked={option.id === selectedId} />
        <div className="flex flex-col">
          <span className="text-base font-medium">{option.name}</span>
          {addressDisplay && (
            <span className="text-base text-gray-500 mt-0.5">
              {addressDisplay}
            </span>
          )}
        </div>
      </div>
      <span className="justify-self-end text-gray-900 font-medium">
        {isLoadingPrice ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : price !== undefined && price !== null ? (
          convertToLocale({
            amount: price,
            currency_code: currencyCode,
          })
        ) : (
          "-"
        )}
      </span>
    </Radio>
  )
}

export default ShippingMethodOption