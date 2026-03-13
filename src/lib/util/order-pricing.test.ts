import { describe, expect, it } from "vitest"
import {
  currencyAmountsMatch,
  getOrderPricingMetadata,
  getPendingPaymentProviderId,
  normalizeCurrencyAmount,
} from "./order-pricing"

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
})
