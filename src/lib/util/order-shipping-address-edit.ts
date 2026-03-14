import { Order } from "@/lib/supabase/types"

const editableOrderShippingAddressStatuses: Order["status"][] = [
  "order_placed",
  "pending",
  "accepted",
]

const EDITABLE_ORDER_SHIPPING_ADDRESS_STATUSES: ReadonlySet<Order["status"]> =
  new Set<Order["status"]>(editableOrderShippingAddressStatuses)

export function canEditOrderShippingAddress(
  status: Order["status"] | null | undefined
): boolean {
  if (!status) {
    return false
  }

  return EDITABLE_ORDER_SHIPPING_ADDRESS_STATUSES.has(status)
}

export const ORDER_SHIPPING_ADDRESS_LOCK_MESSAGE =
  "Shipping address can no longer be edited after shipment."
