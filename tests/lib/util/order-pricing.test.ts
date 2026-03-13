import { describe, expect, it } from "vitest"

import {
  currencyAmountsMatch,
  getAppliedClubSavings,
  getClubSavingsFromItems,
  getOrderPricingMetadata,
  getPendingPaymentProviderId,
  normalizeCurrencyAmount,
} from "@/lib/util/order-pricing"

describe("order-pricing helpers", () => {
  it("reads the pending payment provider from payment collection data", () => {
    expect(
      getPendingPaymentProviderId({
        payment_sessions: [
          { provider_id: "pp_system_default", status: "authorized" },
          { provider_id: "pp_payu_payu", status: "pending" },
        ],
      })
    ).toBe("pp_payu_payu")
  })

  it("normalizes and compares currency amounts safely", () => {
    expect(normalizeCurrencyAmount(1044)).toBe("1044.00")
    expect(currencyAmountsMatch(1044, "1044.00")).toBe(true)
    expect(currencyAmountsMatch("1044.005", "1044.01")).toBe(true)
    expect(currencyAmountsMatch("1044.00", "992.00")).toBe(false)
  })

  it("returns an empty metadata object for non-object input", () => {
    expect(getOrderPricingMetadata(null)).toEqual({})
    expect(getOrderPricingMetadata("invalid")).toEqual({})
  })

  it("prefers persisted order metadata over a zero cart club savings value", () => {
    expect(
      getAppliedClubSavings({
        metadata: {
          club_savings: 125,
          club_savings_amount: 125,
        },
        cartClubSavings: 0,
      })
    ).toBe(125)
  })

  it("derives club savings from order items when metadata is missing", () => {
    expect(
      getClubSavingsFromItems([
        { original_total: 500, total: 475 },
        { original_total: 100, total: 100 },
        { original_total: 250, total: 238 },
      ])
    ).toBe(37)
  })

  it("falls back to cart club savings when order snapshot has no savings data", () => {
    expect(
      getAppliedClubSavings({
        metadata: {},
        items: [{ original_total: 100, total: 100 }],
        cartClubSavings: 42,
      })
    ).toBe(42)
  })
})
