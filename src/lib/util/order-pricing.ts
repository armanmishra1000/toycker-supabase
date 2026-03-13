import { PayUCallbackPayload } from "@/lib/payu"

type UnknownRecord = Record<string, unknown>

export interface OrderPricingMetadata {
  cart_id?: string
  rewards_used?: number
  rewards_discount?: number
  promo_discount?: number
  promo_code?: string | null
  club_savings?: number
  club_savings_amount?: number
  club_discount_percentage?: number
  is_club_member?: boolean
  newly_activated_club_member?: boolean
  payment_discount_amount?: number
  payment_discount_percentage?: number
  payment_method?: string
  payu_payload?: Partial<PayUCallbackPayload>
  club_savings_deducted?: boolean
  deducted_amount?: number
  deduction_date?: string
}

type PaymentSessionLike = {
  provider_id?: string
  status?: string
}

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value)

export const getOrderPricingMetadata = (
  value: unknown
): OrderPricingMetadata => {
  if (!isRecord(value)) {
    return {}
  }

  return value as OrderPricingMetadata
}

export const getPendingPaymentProviderId = (value: unknown): string | null => {
  if (!isRecord(value)) {
    return null
  }

  const paymentSessions = value.payment_sessions
  if (!Array.isArray(paymentSessions)) {
    return null
  }

  for (const session of paymentSessions) {
    if (!isRecord(session)) {
      continue
    }

    const typedSession = session as PaymentSessionLike
    if (
      typedSession.status === "pending" &&
      typeof typedSession.provider_id === "string" &&
      typedSession.provider_id.length > 0
    ) {
      return typedSession.provider_id
    }
  }

  return null
}

const parseCurrencyAmount = (
  value: number | string | null | undefined
): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const normalized = Number.parseFloat(value.trim())
    if (Number.isFinite(normalized)) {
      return normalized
    }
  }

  return null
}

export const normalizeCurrencyAmount = (
  value: number | string | null | undefined
): string | null => {
  const parsed = parseCurrencyAmount(value)
  if (parsed === null) {
    return null
  }

  return parsed.toFixed(2)
}

export const currencyAmountsMatch = (
  left: number | string | null | undefined,
  right: number | string | null | undefined
): boolean => {
  const normalizedLeft = normalizeCurrencyAmount(left)
  const normalizedRight = normalizeCurrencyAmount(right)

  return normalizedLeft !== null && normalizedLeft === normalizedRight
}
