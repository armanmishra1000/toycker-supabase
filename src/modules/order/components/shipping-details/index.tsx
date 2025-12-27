import { convertToLocale } from "@lib/util/money"
import { Order } from "@/lib/supabase/types"
import { Text } from "@modules/common/components/text"

import Divider from "@modules/common/components/divider"

type ShippingDetailsProps = {
  order: Order
}

const ShippingDetails = ({ order }: ShippingDetailsProps) => {
  return (
    <div>
      <h2 className="flex flex-row text-3xl font-normal my-6">
        Delivery
      </h2>
      <div className="flex items-start gap-x-8">
        <div
          className="flex flex-col w-1/3"
          data-testid="shipping-address-summary"
        >
          <Text className="text-base font-semibold text-ui-fg-base mb-1">
            Shipping Address
          </Text>
          <Text className="text-base font-medium text-ui-fg-subtle">
            {order.shipping_address?.first_name}{" "}
            {order.shipping_address?.last_name}
          </Text>
          <Text className="text-base font-medium text-ui-fg-subtle">
            {order.shipping_address?.address_1}{" "}
            {order.shipping_address?.address_2}
          </Text>
          <Text className="text-base font-medium text-ui-fg-subtle">
            {order.shipping_address?.postal_code},{" "}
            {order.shipping_address?.city}
          </Text>
          <Text className="text-base font-medium text-ui-fg-subtle">
            {order.shipping_address?.country_code?.toUpperCase()}
          </Text>
        </div>

        <div
          className="flex flex-col w-1/3 "
          data-testid="shipping-contact-summary"
        >
          <Text className="text-base font-semibold text-ui-fg-base mb-1">Contact</Text>
          <Text className="text-base font-medium text-ui-fg-subtle">
            {order.shipping_address?.phone}
          </Text>
          <Text className="text-base font-medium text-ui-fg-subtle">{order.email}</Text>
        </div>

        <div
          className="flex flex-col w-1/3"
          data-testid="shipping-method-summary"
        >
          <Text className="text-base font-semibold text-ui-fg-base mb-1">Method</Text>
          {order.shipping_methods?.length ? (
            <Text className="text-base font-medium text-ui-fg-subtle">
              {(order as any).shipping_methods[0]?.name} (
              {convertToLocale({
                amount: order.shipping_methods?.[0].total ?? 0,
                currency_code: order.currency_code,
              })}
              )
            </Text>
          ) : (
            <Text className="text-base font-medium text-ui-fg-muted">No delivery</Text>
          )}
        </div>
      </div>
      <Divider className="mt-8" />
    </div>
  )
}

export default ShippingDetails