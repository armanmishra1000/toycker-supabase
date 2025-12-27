"use server"

export const listCartShippingMethods = async (cartId: string) => {
  return [
    {
      id: "standard",
      name: "Standard Shipping",
      amount: 0,
    }
  ]
}

export const calculatePriceForShippingOption = async (
  optionId: string,
  cartId: string,
  data?: Record<string, unknown>
) => {
  return {
    id: optionId,
    price: 0
  }
}
