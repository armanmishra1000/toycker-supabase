"use server"

export const listCartPaymentMethods = async (regionId: string) => {
  return [
    {
      id: "payu",
      name: "PayU",
    }
  ]
}
