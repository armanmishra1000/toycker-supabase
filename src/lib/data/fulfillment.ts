"use server"

export const listCartShippingMethods = async (_cartId: string) => {
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
  _cartId: string,
  _data?: Record<string, unknown>
) => {
  return {
    id: optionId,
    price: 0
  }
}
