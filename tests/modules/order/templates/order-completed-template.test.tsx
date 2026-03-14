import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { Order } from "@/lib/supabase/types"
import OrderCompletedTemplate from "@modules/order/templates/order-completed-template"

const orderDetailsSpy = vi.fn()
const shippingDetailsSpy = vi.fn()

vi.mock("@modules/common/components/cart-totals", () => ({
  default: () => <div>CartTotals</div>,
}))

vi.mock("@modules/order/components/club-welcome-banner", () => ({
  default: () => <div>ClubWelcomeBanner</div>,
}))

vi.mock("@modules/order/components/clear-cart-on-mount", () => ({
  ClearCartOnMount: () => <div data-testid="clear-cart-on-mount" />,
}))

vi.mock("@modules/order/components/help", () => ({
  default: () => <div>Help</div>,
}))

vi.mock("@modules/order/components/items", () => ({
  default: () => <div>Items</div>,
}))

vi.mock("@modules/order/components/cancel-order-button", () => ({
  default: () => <button type="button">Cancel Order</button>,
}))

vi.mock("@modules/order/components/order-details", () => ({
  default: (props: {
    order: Order
    customerPhone?: string | null
  }) => {
    orderDetailsSpy(props)
    return <div>OrderDetails</div>
  },
}))

vi.mock("@modules/order/components/order-tracking", () => ({
  default: () => <div>OrderTracking</div>,
}))

vi.mock("@modules/order/components/shipping-details", () => ({
  default: (props: { order: Order }) => {
    shippingDetailsSpy(props)
    return <div>ShippingDetails</div>
  },
}))

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

describe("OrderCompletedTemplate", () => {
  it("shows payment pending without clearing cart in account context", async () => {
    orderDetailsSpy.mockClear()
    const order = buildOrder({
      status: "pending",
      payment_status: "pending",
      payment_method: "pp_payu_payu",
    })

    render(await OrderCompletedTemplate({ order, context: "account" }))

    expect(
      screen.getByRole("heading", { name: "Payment Pending" })
    ).toBeInTheDocument()
    expect(screen.queryByText("Order Confirmed!")).not.toBeInTheDocument()
    expect(
      screen.queryByTestId("clear-cart-on-mount")
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText("Stay updated on every step")
    ).not.toBeInTheDocument()
  })

  it("clears cart only for confirmed post-checkout orders", async () => {
    orderDetailsSpy.mockClear()
    const order = buildOrder({
      status: "order_placed",
      payment_status: "captured",
      payment_method: "pp_payu_payu",
    })

    render(await OrderCompletedTemplate({ order, context: "post_checkout" }))

    expect(
      screen.getByRole("heading", { name: "Order Confirmed!" })
    ).toBeInTheDocument()
    expect(screen.getByTestId("clear-cart-on-mount")).toBeInTheDocument()
    expect(screen.getByText("Stay updated on every step")).toBeInTheDocument()
  })

  it("passes the customer phone to the shared order details component", async () => {
    orderDetailsSpy.mockClear()
    const order = buildOrder()

    render(
      await OrderCompletedTemplate({
        order,
        customerPhone: "919876543210",
        context: "account",
      })
    )

    expect(orderDetailsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        order,
        customerPhone: "919876543210",
      })
    )
  })

  it("passes the order shipping snapshot to the shipping details component", async () => {
    orderDetailsSpy.mockClear()
    shippingDetailsSpy.mockClear()

    const order = buildOrder({
      shipping_address: {
        first_name: "Receiver",
        last_name: "Updated",
        address_1: "22 New Lane",
        address_2: "Floor 2",
        city: "Surat",
        country_code: "in",
        province: "Gujarat",
        postal_code: "395003",
        phone: "9898989898",
        company: "Warehouse",
      },
    })

    render(await OrderCompletedTemplate({ order, context: "account" }))

    expect(shippingDetailsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        order,
      })
    )
  })
})
