"use server"

import { cache } from 'react'
import { Region } from "@/lib/supabase/types"

const DEFAULT_REGION: Region = {
  id: "reg_india",
  name: "India",
  currency_code: "inr",
  countries: [
    {
      id: "in",
      iso_2: "in",
      display_name: "India",
    },
  ],
}

export const getRegion = cache(async (): Promise<Region> => {
  return DEFAULT_REGION
})

export const listRegions = cache(async (): Promise<Region[]> => {
  return [DEFAULT_REGION]
})

export const retrieveRegion = cache(async (_id: string): Promise<Region> => {
  return DEFAULT_REGION
})