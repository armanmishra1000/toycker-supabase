/**
 * Pick specific properties from an object
 * Native replacement for lodash pick
 */
function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key]
    }
  }
  return result
}

/**
 * Deep equality check for objects
 * Native replacement for lodash isEqual (for simple objects)
 */
function isEqual(obj1: unknown, obj2: unknown): boolean {
  if (obj1 === obj2) return true
  if (obj1 == null || obj2 == null) return false
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false

  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)

  if (keys1.length !== keys2.length) return false

  for (const key of keys1) {
    if (!keys2.includes(key)) return false
    const val1 = (obj1 as Record<string, unknown>)[key]
    const val2 = (obj2 as Record<string, unknown>)[key]

    if (typeof val1 === 'object' && typeof val2 === 'object') {
      if (!isEqual(val1, val2)) return false
    } else if (val1 !== val2) {
      return false
    }
  }

  return true
}

export default function compareAddresses(address1: unknown, address2: unknown) {
  return isEqual(
    pick(address1 as Record<string, unknown>, [
      "first_name",
      "last_name",
      "address_1",
      "company",
      "postal_code",
      "city",
      "country_code",
      "province",
      "phone",
    ]),
    pick(address2 as Record<string, unknown>, [
      "first_name",
      "last_name",
      "address_1",
      "company",
      "postal_code",
      "city",
      "country_code",
      "province",
      "phone",
    ])
  )
}

