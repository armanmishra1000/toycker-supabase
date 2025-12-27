"use server"

import { Region } from "@/lib/supabase/types"

export const getRegion = async (countryCode?: string): Promise<Region> => {
  return {
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
}

export const listRegions = async (): Promise<Region[]> => {
  return [await getRegion()]
}

export const retrieveRegion = async (id: string): Promise<Region> => {
  return await getRegion()
}