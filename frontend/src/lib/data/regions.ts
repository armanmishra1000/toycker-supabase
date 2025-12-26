"use server"

import { sdk } from "@lib/config"
import { DEFAULT_COUNTRY_CODE, DEFAULT_REGION_ID } from "@lib/constants/region"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { getCacheOptions } from "./cookies"

let cachedRegion: HttpTypes.StoreRegion | null = null

export const retrieveRegion = async (id: string) => {
  const next = {
    ...(await getCacheOptions(["regions", id].join("-"), { globalTag: "regions" })),
  }

  return sdk.client
    .fetch<{ region: HttpTypes.StoreRegion }>(`/store/regions/${id}`, {
      method: "GET",
      next,
      cache: "force-cache",
    })
    .then(({ region }) => region)
    .catch(medusaError)
}

const loadDefaultRegion = async (forceRefresh?: boolean) => {
  if (cachedRegion && !forceRefresh) {
    return cachedRegion
  }

  if (DEFAULT_REGION_ID) {
    cachedRegion = await retrieveRegion(DEFAULT_REGION_ID)
    return cachedRegion
  }

  try {
    const next = {
      ...(await getCacheOptions("regions")),
    }

    const fallbackRegion = await sdk.client
      .fetch<{ regions: HttpTypes.StoreRegion[] }>(`/store/regions`, {
        method: "GET",
        cache: "force-cache",
        next,
      })
      .then(({ regions }) => regions?.[0])

    if (!fallbackRegion) {
      throw new Error("No regions available to use as default.")
    }

    cachedRegion = fallbackRegion
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "NEXT_PUBLIC_DEFAULT_REGION_ID not set. Falling back to the first available region."
      )
    }
    return cachedRegion
  } catch (error) {
    throw new Error(
      "Missing NEXT_PUBLIC_DEFAULT_REGION_ID and unable to load a fallback region. Set the env to your India region id."
    )
  }
}

export const listRegions = async () => {
  const region = await loadDefaultRegion()
  return region ? [region] : []
}

type GetRegionOptions = {
  forceRefresh?: boolean
}

export const getRegion = async (_countryCode?: string, options?: GetRegionOptions) => {
  try {
    return await loadDefaultRegion(options?.forceRefresh)
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to load default region", error)
    }
    return null
  }
}

