"use server"

export const getRegion = async (countryCode?: string) => {
  return {
    id: "reg_india",
    name: "India",
    currency_code: "inr",
    countries: [
      {
        id: "in",
        iso_2: "in",
        iso_3: "ind",
        name: "India",
        display_name: "India",
      },
    ],
  }
}

export const listRegions = async () => {
  return [await getRegion()]
}

export const retrieveRegion = async (id: string) => {
  return await getRegion()
}
