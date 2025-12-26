"use server"

import { cache } from "react"
import { randomUUID } from "crypto"

import { sdk } from "@lib/config"
import { DEFAULT_COUNTRY_CODE } from "@lib/constants/region"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import {
  getAuthHeaders,
  getCacheTag,
  getCartId,
  removeCartId,
  setCartId,
} from "./cookies"
import { getRegion } from "./regions"

const CART_RESPONSE_FIELDS = [
  "*items",
  "*region",
  "*region.countries",
  "*items.product",
  "*items.variant",
  "*items.thumbnail",
  "*items.metadata",
  "+items.total",
  "+items.original_total",
  "+items.subtotal",
  "+items.discount_total",
  "*promotions",
  "*shipping_address",
  "*billing_address",
  "email",
  "*payment_collection",
  "*payment_collection.payment_sessions",
  "shipping_methods.id",
  "shipping_methods.shipping_option_id",
  "+shipping_methods.name",
  "+shipping_methods.total",
  "+shipping_methods.subtotal",
  "+shipping_methods.tax_total",
  "+subtotal",
  "+total",
  "+item_total",
  "+item_subtotal",
  "+tax_total",
  "+discount_total",
  "+shipping_total",
  "+shipping_subtotal",
  "*shipping_methods.shipping_option",
].join(",")

type LineItemMetadataValue = string | number | boolean | null

export type GiftWrapMetadata = {
  gift_wrap: true
  gift_wrap_fee: number
  gift_wrap_packages: number
}

type LineItemMetadata = Record<string, LineItemMetadataValue> | GiftWrapMetadata

/**
 * Retrieves a cart by its ID. If no ID is provided, it will use the cart ID from the cookies.
 * @param cartId - optional - The ID of the cart to retrieve.
 * @returns The cart object if found, or null if not found.
 */
export const retrieveCart = cache(async (cartId?: string, fields?: string, cacheBust?: number) => {
  const id = cartId || (await getCartId())
  fields ??= CART_RESPONSE_FIELDS

  if (!id) {
    return null
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return await sdk.client
    .fetch<HttpTypes.StoreCartResponse>(`/store/carts/${id}`, {
      method: "GET",
      query: {
        fields,
      },
      headers,
      cache: "no-store",
    })
    .then(({ cart }: { cart: HttpTypes.StoreCart }) => cart)
    .catch(() => null)
})

export async function getOrSetCart(countryCode: string = DEFAULT_COUNTRY_CODE) {
  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  let cart = await retrieveCart(undefined, "id,region_id")

  const headers = {
    ...(await getAuthHeaders()),
  }

  if (!cart) {
    const cartResp = await sdk.store.cart.create(
      { region_id: region.id },
      {},
      headers
    )
    cart = cartResp.cart

    await setCartId(cart.id)

    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  }

  if (cart && cart?.region_id !== region.id) {
    await sdk.store.cart.update(cart.id, { region_id: region.id }, {}, headers)
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  }

  return cart
}

export async function updateCart(data: HttpTypes.StoreUpdateCart) {
  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("No existing cart found, please create one before updating")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.cart
    .update(cartId, data, {}, headers)
    .then(async ({ cart }: { cart: HttpTypes.StoreCart }) => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)

      return cart
    })
    .catch(medusaError)
}

export async function addToCart({
  variantId,
  quantity,
  countryCode = DEFAULT_COUNTRY_CODE,
  metadata,
  idempotencyKey,
}: {
  variantId: string
  quantity: number
  countryCode?: string
  metadata?: LineItemMetadata
  idempotencyKey?: string
}) {
  if (!variantId) {
    throw new Error("Missing variant ID when adding to cart")
  }

  const cart = await getOrSetCart(countryCode)

  if (!cart) {
    throw new Error("Error retrieving or creating cart")
  }

  const headers: Record<string, string> = {
    ...(await getAuthHeaders()),
  }

  if (idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey
  }

  const lineItemPayload: HttpTypes.StoreAddCartLineItem & {
    metadata?: LineItemMetadata
  } = {
    variant_id: variantId,
    quantity,
  }

  if (metadata) {
    lineItemPayload.metadata = metadata
  }

  return sdk.store.cart
    .createLineItem(
      cart.id,
      lineItemPayload,
      {
        fields: CART_RESPONSE_FIELDS,
      },
      headers,
    )
    .then(async ({ cart: updatedCart }: { cart: HttpTypes.StoreCart }) => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)

      return updatedCart
    })
    .catch(medusaError)
}

export async function createBuyNowCart({
  variantId,
  quantity,
  countryCode = DEFAULT_COUNTRY_CODE,
  metadata,
}: {
  variantId: string
  quantity: number
  countryCode?: string
  metadata?: LineItemMetadata
}) {
  if (!variantId) {
    throw new Error("Missing variant ID when creating buy now cart")
  }

  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  const headers: Record<string, string> = {
    ...(await getAuthHeaders()),
  }

  const { cart } = await sdk.store.cart.create(
    { region_id: region.id },
    {},
    headers
  )

  await sdk.store.cart.createLineItem(
    cart.id,
    {
      variant_id: variantId,
      quantity,
      ...(metadata ? { metadata } : {}),
    },
    {},
    headers
  )

  await setCartId(cart.id)

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag)

  const fulfillmentCacheTag = await getCacheTag("fulfillment")
  revalidateTag(fulfillmentCacheTag)

  return retrieveCart(cart.id)
}

export async function updateLineItem({
  lineId,
  quantity,
}: {
  lineId: string
  quantity: number
}): Promise<HttpTypes.StoreCart> {
  if (!lineId) {
    throw new Error("Missing lineItem ID when updating line item")
  }

  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("Missing cart ID when updating line item")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.cart
    .updateLineItem(cartId, lineId, { quantity }, {}, headers)
    .then(async ({ cart }: { cart: HttpTypes.StoreCart }) => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)

      return cart
    })
    .catch(medusaError)
}

export async function deleteLineItem(lineId: string) {
  if (!lineId) {
    throw new Error("Missing lineItem ID when deleting line item")
  }

  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("Missing cart ID when deleting line item")
  }

  const cart = (await retrieveCart(cartId, "id,completed_at")) as (HttpTypes.StoreCart & {
    completed_at?: string | null
  }) | null

  if (cart?.completed_at) {
    await removeCartId()
    throw new Error(
      "This order has already been placed. Please refresh to start a new cart."
    )
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.cart
    .deleteLineItem(cartId, lineId, {}, headers)
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)
    })
    .catch(medusaError)
}

export async function setShippingMethod({
  cartId,
  shippingMethodId,
}: {
  cartId: string
  shippingMethodId: string
}) {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.cart
    .addShippingMethod(cartId, { option_id: shippingMethodId }, {}, headers)
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
    })
    .catch(medusaError)
}

export async function initiatePaymentSession(
  cart: HttpTypes.StoreCart,
  data: HttpTypes.StoreInitializePaymentSession
) {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.payment
    .initiatePaymentSession(cart, data, {}, headers)
    .then(async (resp) => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
      return resp
    })
    .catch(medusaError)
}

export async function applyPromotions(codes: string[]) {
  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("No existing cart found")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.cart
    .update(cartId, { promo_codes: codes }, {}, headers)
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)
    })
    .catch(medusaError)
}

export async function submitPromotionForm(
  currentState: unknown,
  formData: FormData
) {
  const code = formData.get("code") as string
  try {
    await applyPromotions([code])
  } catch (e: unknown) {
    // Return error message string for useActionState
    if (e instanceof Error) {
      return e.message
    }
    if (typeof e === "string") {
      return e
    }
    return "An error occurred applying the promotion code"
  }
}

// TODO: Pass a POJO instead of a form entity here
export async function setAddresses(currentState: unknown, formData: FormData) {
  try {
    if (!formData) {
      throw new Error("No form data found when setting addresses")
    }
    const cartId = await getCartId()
    if (!cartId) {
      throw new Error("No existing cart found when setting addresses")
    }

    const getString = (key: string) => {
      const value = formData.get(key)
      return typeof value === "string" ? value : undefined
    }

    const shippingAddress = {
      first_name: getString("shipping_address.first_name"),
      last_name: getString("shipping_address.last_name"),
      address_1: getString("shipping_address.address_1"),
      address_2: "",
      company: getString("shipping_address.company"),
      postal_code: getString("shipping_address.postal_code"),
      city: getString("shipping_address.city"),
      country_code: getString("shipping_address.country_code"),
      province: getString("shipping_address.province"),
      phone: getString("shipping_address.phone"),
    }

    const data: Partial<HttpTypes.StoreUpdateCart> = {
      shipping_address: shippingAddress,
      email: getString("email"),
    }

    const sameAsBilling = formData.get("same_as_billing")
    if (sameAsBilling === "on") data.billing_address = data.shipping_address

    if (sameAsBilling !== "on")
      data.billing_address = {
        first_name: getString("billing_address.first_name"),
        last_name: getString("billing_address.last_name"),
        address_1: getString("billing_address.address_1"),
        address_2: "",
        company: getString("billing_address.company"),
        postal_code: getString("billing_address.postal_code"),
        city: getString("billing_address.city"),
        country_code: getString("billing_address.country_code"),
        province: getString("billing_address.province"),
        phone: getString("billing_address.phone"),
      }
    await updateCart(data)

    // Auto-select the first available shipping method
    await setDefaultShippingMethod(cartId)
  } catch (e: unknown) {
    return medusaError(e)
  }

  redirect(`/checkout?step=payment`)
}

/**
 * Auto-selects the first available shipping method for a cart
 * @param cartId - The ID of the cart to set the shipping method for
 */
export async function setDefaultShippingMethod(cartId: string) {
  const headers = {
    ...(await getAuthHeaders()),
  }

  try {
    // Get available shipping options using the direct API
    const { shipping_options } = await sdk.client.fetch<{
      shipping_options: HttpTypes.StoreCartShippingOption[]
    }>("/store/shipping-options", {
      query: { cart_id: cartId },
      headers,
      cache: "no-store",
    })

    // Select the first available shipping option
    if (shipping_options && shipping_options.length > 0) {
      const firstOption = shipping_options[0]
      await sdk.store.cart
        .addShippingMethod(cartId, { option_id: firstOption.id }, {}, headers)
        .then(async () => {
          const cartCacheTag = await getCacheTag("carts")
          revalidateTag(cartCacheTag)
        })
        .catch(medusaError)
    }
  } catch (e) {
    // Silently fail - shipping method selection is not critical
    console.error("Failed to set default shipping method:", e)
  }
}

/**
 * Places an order for a cart. If no cart ID is provided, it will use the cart ID from the cookies.
 * @returns The cart object if the order was successful, or null if not.
 * @returns The order ID if successful, or the cart object if not yet completed.
 */
export async function placeOrder(cartId?: string) {
  const id = cartId || (await getCartId())

  if (!id) {
    throw new Error("No existing cart found when placing an order")
  }

  const headers: Record<string, string> = {
    ...(await getAuthHeaders()),
  }

  headers["Idempotency-Key"] = `checkout-complete-${id}-${randomUUID()}`

  const cartRes = await sdk.store.cart
    .complete(id, {}, headers)
    .then(async (cartRes) => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
      return cartRes
    })
    .catch(medusaError)

  if (cartRes?.type === "order") {
    const orderCacheTag = await getCacheTag("orders")
    revalidateTag(orderCacheTag)

    removeCartId()
    redirect(`/order/${cartRes?.order.id}/confirmed`)
  }

  return cartRes.cart
}

/**
 * Updates the countrycode param and revalidates the regions cache
 * @param regionId
 * @param countryCode
 */
export async function updateRegion(countryCode: string, currentPath: string) {
  const cartId = await getCartId()
  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  if (cartId) {
    await updateCart({ region_id: region.id })
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  }

  const regionCacheTag = await getCacheTag("regions")
  revalidateTag(regionCacheTag)

  const productsCacheTag = await getCacheTag("products")
  revalidateTag(productsCacheTag)

  const normalizedPath = currentPath.startsWith("/") ? currentPath : `/${currentPath}`
  redirect(normalizedPath)
}

export const listCartOptions = cache(async () => {
  const cartId = await getCartId()
  const headers = {
    ...(await getAuthHeaders()),
  }
  return await sdk.client.fetch<{
    shipping_options: HttpTypes.StoreCartShippingOption[]
  }>("/store/shipping-options", {
    query: { cart_id: cartId },
    headers,
    cache: "no-store",
  })
})
