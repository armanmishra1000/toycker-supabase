import { CheckCircle } from "lucide-react"
import { Text } from "@modules/common/components/text"
import { cn } from "@lib/util/cn"

type ShippingHeaderProps = {
  isOpen: boolean
  hasMethods: boolean
  cart: any
  onEdit: () => void
}

const ShippingHeader = ({
  isOpen,
  hasMethods,
  cart,
  onEdit,
}: ShippingHeaderProps) => {
  return (
    <div className="flex flex-row items-center justify-between mb-6">
      <Text
        as="h2"
        weight="bold"
        className={cn("flex flex-row text-3xl gap-x-2 items-baseline", {
          "opacity-50 pointer-events-none select-none":
            !isOpen && !hasMethods,
        })}
      >
        Delivery
        {!isOpen && hasMethods && (
          <CheckCircle className="h-6 w-6 text-green-500" />
        )}
      </Text>
      {!isOpen &&
        cart?.shipping_address &&
        cart?.billing_address &&
        cart?.email && (
          <Text>
            <button
              onClick={onEdit}
              className="text-blue-600 hover:text-blue-700 font-medium"
              data-testid="edit-delivery-button"
            >
              Edit
            </button>
          </Text>
        )}
    </div>
  )
}

export default ShippingHeader