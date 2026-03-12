const INDIA_COUNTRY_CODE = "91"
const INDIA_LOCAL_PHONE_LENGTH = 10
const INDIA_E164_PHONE_LENGTH = 12

function getDigits(phone: string): string {
  return phone.replace(/\D/g, "")
}

function isNormalizedIndianPhone(phone: string): boolean {
  const digits = getDigits(phone)

  return (
    digits.length === INDIA_E164_PHONE_LENGTH &&
    digits.startsWith(INDIA_COUNTRY_CODE) &&
    (phone === digits || phone === `+${digits}`)
  )
}

export function getCheckoutPhoneValue(
  ...candidates: Array<string | null | undefined>
): string {
  for (const candidate of candidates) {
    const trimmedCandidate = candidate?.trim()

    if (!trimmedCandidate) {
      continue
    }

    if (isNormalizedIndianPhone(trimmedCandidate)) {
      return getDigits(trimmedCandidate).slice(-INDIA_LOCAL_PHONE_LENGTH)
    }

    return trimmedCandidate
  }

  return ""
}
