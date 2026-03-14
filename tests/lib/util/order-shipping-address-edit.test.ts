import { describe, expect, it } from "vitest"

import {
  ORDER_SHIPPING_ADDRESS_LOCK_MESSAGE,
  canEditOrderShippingAddress,
} from "@/lib/util/order-shipping-address-edit"

describe("order shipping address edit rules", () => {
  it("allows edits only before shipment", () => {
    expect(canEditOrderShippingAddress("order_placed")).toBe(true)
    expect(canEditOrderShippingAddress("pending")).toBe(true)
    expect(canEditOrderShippingAddress("accepted")).toBe(true)

    expect(canEditOrderShippingAddress("shipped")).toBe(false)
    expect(canEditOrderShippingAddress("delivered")).toBe(false)
    expect(canEditOrderShippingAddress("cancelled")).toBe(false)
    expect(canEditOrderShippingAddress("failed")).toBe(false)
  })

  it("exposes the locked message used by the admin page", () => {
    expect(ORDER_SHIPPING_ADDRESS_LOCK_MESSAGE).toBe(
      "Shipping address can no longer be edited after shipment."
    )
  })
})
