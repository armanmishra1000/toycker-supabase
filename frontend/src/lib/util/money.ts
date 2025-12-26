import { DEFAULT_COUNTRY_CODE } from "@lib/constants/region"
import { isEmpty } from "./isEmpty"

const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  IN: "INR",
  US: "USD",
  GB: "GBP",
  CA: "CAD",
  AU: "AUD",
  SG: "SGD",
  AE: "AED",
}

const DEFAULT_CURRENCY_CODE = (() => {
  const fromEnv = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY_CODE
  if (fromEnv && !isEmpty(fromEnv)) {
    return fromEnv.toUpperCase()
  }

  const byCountry = COUNTRY_CURRENCY_MAP[DEFAULT_COUNTRY_CODE.toUpperCase()]
  if (byCountry) {
    return byCountry
  }

  return "USD"
})()

const warnedFallbacks = new Set<string>()

const warnMissingCurrency = (fallbackCurrency: string) => {
  const key = fallbackCurrency || "UNKNOWN"
  if (warnedFallbacks.has(key)) {
    return
  }
  warnedFallbacks.add(key)
  console.warn(`[money] currency_code missing; using fallback ${fallbackCurrency}`)
}

type ConvertToLocaleParams = {
  amount: number
  currency_code: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  locale?: string
}

export const convertToLocale = ({
  amount,
  currency_code,
  minimumFractionDigits,
  maximumFractionDigits,
  locale,
}: ConvertToLocaleParams) => {
  const normalizedCurrency = currency_code && !isEmpty(currency_code)
    ? currency_code.toUpperCase()
    : DEFAULT_CURRENCY_CODE

  if (!currency_code || isEmpty(currency_code)) {
    warnMissingCurrency(normalizedCurrency)
  }

  const normalizedLocale = (() => {
    const hasLocale = locale && !isEmpty(locale)
    if (hasLocale) return locale as string
    if (normalizedCurrency === "INR") return "en-IN"
    return "en-US"
  })()

  const format = () =>
    new Intl.NumberFormat(normalizedLocale, {
      style: "currency",
      currency: normalizedCurrency,
      currencyDisplay: "symbol",
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(amount)

  // Primary formatting
  let formatted = format()

  // If INR still renders without the symbol (font/locale issues), try narrowSymbol, then manual prefix
  if (normalizedCurrency === "INR" && !formatted.includes("₹")) {
    formatted = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(amount)

    if (!formatted.includes("₹")) {
      const localized = new Intl.NumberFormat("en-IN", {
        minimumFractionDigits,
        maximumFractionDigits,
      }).format(amount)
      formatted = `₹${localized}`
    }
  }

  return formatted
}
