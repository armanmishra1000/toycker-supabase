import { ageCategories } from "@modules/layout/config/navigation"

const normalizeToken = (value?: string) => value?.trim().toLowerCase()

const singularizeAgeLabel = (value?: string) =>
  value
    ?.replace(/months/gi, "month")
    .replace(/years/gi, "year")
    .replace(/yrs/gi, "year")
    .replace(/mos/gi, "month") ?? undefined

const slugifyAgeValue = (value?: string) => {
  if (!value) {
    return undefined
  }

  const normalized = singularizeAgeLabel(value)

  return normalized
    ?.toLowerCase()
    .replace(/\+/g, " plus ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    || undefined
}

const ageAliasMap = new Map<string, string>()

const registerAgeAlias = (alias: string | undefined, label: string) => {
  if (!alias) {
    return
  }

  const normalized = normalizeToken(alias)
  if (normalized) {
    ageAliasMap.set(normalized, label)
  }

  const slugged = slugifyAgeValue(alias)
  if (slugged) {
    ageAliasMap.set(slugged, label)
  }

  const singular = singularizeAgeLabel(alias)
  const singularNormalized = normalizeToken(singular)
  if (singularNormalized) {
    ageAliasMap.set(singularNormalized, label)
  }

  const singularSlug = slugifyAgeValue(singular)
  if (singularSlug) {
    ageAliasMap.set(singularSlug, label)
  }
}

ageCategories.forEach((category) => {
  registerAgeAlias(category.id, category.label)
  registerAgeAlias(category.label, category.label)
})

export const resolveAgeFilterValue = (input?: string): string | undefined => {
  const normalized = normalizeToken(input)

  if (!normalized) {
    return undefined
  }

  if (ageAliasMap.has(normalized)) {
    return ageAliasMap.get(normalized)
  }

  const slugged = slugifyAgeValue(input)
  if (slugged && ageAliasMap.has(slugged)) {
    return ageAliasMap.get(slugged)
  }

  return undefined
}

export const normalizeAgeFilterForComparison = (value?: string) => {
  const resolved = resolveAgeFilterValue(value)
  const comparableSource = resolved ?? value
  return slugifyAgeValue(comparableSource ?? undefined)
}

export const ageMetadataMatchesFilter = (metadataValue: unknown, filter?: string) => {
  const normalizedFilter = normalizeAgeFilterForComparison(filter)

  if (!normalizedFilter) {
    return true
  }

  if (typeof metadataValue !== "string") {
    return false
  }

  const normalizedMetadata = normalizeAgeFilterForComparison(metadataValue)

  if (!normalizedMetadata) {
    return false
  }

  return normalizedMetadata === normalizedFilter
}
