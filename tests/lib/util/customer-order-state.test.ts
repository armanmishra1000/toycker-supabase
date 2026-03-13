import { describe, expect, it } from "vitest"

import { Order } from "@/lib/supabase/types"
import {
  getCustomerOrderPageContent,
  isCashOnDeliveryLikeOrder,
} from "@/lib/util/customer-order-state"

const buildOrder = (overrides: Partial<Order> = {}): Order => ({
  id: "order-1",
  user_id: "user-1",
  display_id: 101,
  customer_email: "buyer@example.com",
  email: "buyer@example.com",
  promo_code: null,
  total_amount: 1000,
  currency_code: "inr",
  status: "pending",
  fulfillment_status: "not_shipped",
  payment_status: "pending",
  payu_txn_id: null,
  shipping_address: null,
  billing_address: null,
  shipping_method: null,
  shipping_methods: [],
  shipping_partner_id: null,
  shipping_partner: null,
  tracking_number: null,
  payment_method: "pp_payu_payu",
  payment_collection: null,
  metadata: null,
  created_at: "2026-03-13T10:00:00.000Z",
  updated_at: "2026-03-13T10:00:00.000Z",
  items: [],
  total: 1000,
  subtotal: 1000,
  tax_total: 0,
  shipping_total: 0,
  discount_total: 0,
  gift_card_total: 0,
  payment_collections: [],
  ...overrides,
})

describe("customer order page state", () => {
  it("treats unpaid online orders as payment pending", () => {
    const order = buildOrder({
      status: "pending",
      payment_status: "pending",
      payment_method: "pp_payu_payu",
    })

    expect(getCustomerOrderPageContent(order)).toMatchObject({
      state: "payment_pending",
      title: "Payment Pending",
      showTracking: false,
    })
  })

  it("treats paid online orders as confirmed", () => {
    const order = buildOrder({
      status: "order_placed",
      payment_status: "captured",
      payment_method: "pp_payu_payu",
    })

    expect(getCustomerOrderPageContent(order)).toMatchObject({
      state: "confirmed",
      title: "Order Confirmed!",
      showTracking: true,
    })
  })

  it("keeps COD orders confirmed even while payment is pending", () => {
    const order = buildOrder({
      status: "pending",
      payment_status: "pending",
      payment_method: "cash_on_delivery",
    })

    expect(isCashOnDeliveryLikeOrder(order)).toBe(true)
    expect(getCustomerOrderPageContent(order)).toMatchObject({
      state: "confirmed",
      title: "Order Confirmed!",
      showTracking: true,
    })
  })

  it("treats cancelled or failed orders as cancelled", () => {
    const order = buildOrder({
      status: "cancelled",
      payment_status: "failed",
      payment_method: "pp_payu_payu",
    })

    expect(getCustomerOrderPageContent(order)).toMatchObject({
      state: "cancelled",
      title: "Order Cancelled",
      showTracking: false,
    })
  })
})
