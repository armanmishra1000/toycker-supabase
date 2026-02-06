"use server"

import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import { Cart, ShippingOption, PaymentCollection, Promotion } from "@/lib/supabase/types"
import { revalidateTag, revalidatePath } from "next/cache"
import { getCartId, setCartId, removeCartId } from "./cookies"
export { removeCartId }
import { randomUUID } from "crypto"
import { redirect } from "next/navigation"
import { generatePayUHash, PayUHashParams } from "@/lib/payu"
import { getBaseURL } from "@/lib/util/env"
import { getAuthUser } from "./auth"



import {
  mapCartItems,
  calculateCartTotals,
  CartShippingMethod
} from "@/lib/util/cart-calculations"

export async function retrieveCart(cartId?: string): Promise<Cart | null> {
  return cachedRetrieveCart(cartId)
}

const cachedRetrieveCart = cache(async (cartId?: string): Promise<Cart | null> => {
  return retrieveCartRaw(cartId)
})

export async function retrieveCartRaw(cartId?: string): Promise<Cart | null> {
  const id = cartId || (await getCartId())
  if (!id) return null

  const supabase = await createClient()
  const { data: cartData, error } = await supabase
    .from("carts")
    .select(`
      id,
      email,
      user_id,
      region_id,
      currency_code,
      shipping_address,
      billing_address,
      shipping_methods,
      payment_collection,
      metadata,
      created_at,
      updated_at,
      promo_code,
      discount_total,
      items:cart_items(
        *,
        product:products(*),
        variant:product_variants(*)
      ),
      promotion:promotions(*)
    `)
    .eq("id", id)
    .maybeSingle()

  if (error || !cartData) {
    return null
  }

  // Check if user is a club member and get discount percentage
  let isClubMember = false
  let clubDiscountPercentage = 0
  let availableRewards = 0

  const user = await getAuthUser()
  if (user) {
    isClubMember = user.user_metadata?.is_club_member === true
    if (isClubMember) {
      // Dynamically import to avoid circular dependency
      const { getClubSettings } = await import("@lib/data/club")
      const settings = await getClubSettings()
      clubDiscountPercentage = settings.discount_percentage

      // Get reward wallet balance
      const { data: wallet } = await supabase
        .from("reward_wallets")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle()

      availableRewards = wallet?.balance ?? 0
    }
  }

  // Get global settings for gift wrap fee
  const { getGlobalSettings } = await import("@lib/data/settings")
  const globalSettings = await getGlobalSettings()
  const giftWrapFee = globalSettings?.gift_wrap_fee ?? 50

  const items = mapCartItems(cartData.items as any || [], clubDiscountPercentage, giftWrapFee)

  // Get payment discount percentage if a method is selected
  const selectedPaymentProviderId = cartData.payment_collection?.payment_sessions?.find(
    (s: any) => s.status === "pending"
  )?.provider_id

  let paymentDiscountPercentage = 0
  if (selectedPaymentProviderId) {
    const { data: provider } = await supabase
      .from("payment_providers")
      .select("discount_percentage")
      .eq("id", selectedPaymentProviderId)
      .maybeSingle()

    paymentDiscountPercentage = provider?.discount_percentage || 0
  }

  // Get shipping threshold from active shipping options
  const { data: shippingOptions } = await supabase
    .from("shipping_options")
    .select("*")
    .eq("is_active", true)

  const shippingOptionsData = (shippingOptions || []).map(opt => ({
    shipping_option_id: opt.id,
    name: opt.name,
    amount: opt.amount,
    min_order_free_shipping: opt.min_order_free_shipping
  })) as CartShippingMethod[]

  const standardOption = shippingOptionsData.find(so => so.name.toLowerCase().includes('standard'))
  const defaultShippingOption = standardOption || shippingOptionsData.find(so => so.min_order_free_shipping !== null)

  const totals = calculateCartTotals({
    items,
    promotion: (cartData.promotion as any) as Promotion,
    shippingMethods: cartData.shipping_methods as CartShippingMethod[],
    availableRewards,
    cartMetadata: (cartData.metadata || {}) as Record<string, unknown>,
    isClubMember,
    clubDiscountPercentage,
    paymentDiscountPercentage,
    defaultShippingOption,
  })

  const freeShippingThreshold = standardOption?.min_order_free_shipping
    || shippingOptionsData.find(so => so.min_order_free_shipping !== null)?.min_order_free_shipping
    || 500 // Fallback

  const cart: Cart = {
    ...cartData,
    ...totals,
    items,
    promotions: cartData.promotion ? [(cartData.promotion as any) as Promotion] : [],
    free_shipping_threshold: freeShippingThreshold
  }

  return cart
}



export async function getOrSetCart(): Promise<Cart> {
  const existingCart = await retrieveCart()
  if (existingCart) return existingCart

  const supabase = await createClient()
  const user = await getAuthUser()

  const newCartId = randomUUID()

  const { data: newCart, error } = await supabase
    .from("carts")
    .insert({
      id: newCartId,
      user_id: user?.id || null,  // Supports Guests (NULL)
      currency_code: "inr",
      email: user?.email || null
    })
    .select()
    .single()

  if (error || !newCart) {
    throw new Error("Could not create cart")
  }

  await setCartId(newCart.id)
  revalidateTag("cart", "max")

  const freshCart = await retrieveCart(newCart.id)
  if (!freshCart) {
    throw new Error("Could not retrieve newly created cart")
  }

  return freshCart
}

export async function addToCart({
  productId,
  quantity,
  variantId,
  metadata,
}: {
  productId: string
  quantity: number
  variantId?: string
  metadata?: Record<string, unknown>
}) {
  const cartId = (await getCartId()) || (await getOrSetCart()).id
  const supabase = await createClient()

  let targetVariantId = variantId === productId ? undefined : variantId
  if (!targetVariantId) {
    const { data: variants } = await supabase
      .from("product_variants")
      .select("id")
      .eq("product_id", productId)
      .limit(1)

    if (variants && variants.length > 0) {
      targetVariantId = variants[0].id
    }
  }

  // Find if item already exists in cart with EXACT SAME metadata.
  const query = supabase
    .from("cart_items")
    .select("*")
    .eq("cart_id", cartId)
    .eq("product_id", productId)

  if (targetVariantId) {
    query.eq("variant_id", targetVariantId)
  } else {
    query.is("variant_id", null)
  }

  if (metadata) {
    query.contains("metadata", metadata)
  } else {
    query.is("metadata", null)
  }

  const { data: existingItems } = await query

  // Filter for exact metadata match to be safe
  const existingItem = existingItems?.find(item => {
    const itemMeta = item.metadata || {}
    const searchMeta = metadata || {}
    const itemKeys = Object.keys(itemMeta)
    const searchKeys = Object.keys(searchMeta)
    if (itemKeys.length !== searchKeys.length) return false
    return searchKeys.every(key => itemMeta[key] === searchMeta[key])
  })

  if (existingItem) {
    const currentQuantity = typeof existingItem.quantity === 'number' ? existingItem.quantity : 0
    await supabase
      .from("cart_items")
      .update({ quantity: currentQuantity + quantity })
      .eq("id", existingItem.id)
  } else {
    await supabase
      .from("cart_items")
      .insert({
        cart_id: cartId,
        product_id: productId,
        variant_id: targetVariantId,
        quantity,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null
      })
  }

  revalidateTag("cart", "max")
  return retrieveCartRaw(cartId)
}

export async function addMultipleToCart(items: {
  productId: string
  quantity: number
  variantId?: string
  metadata?: Record<string, unknown>
}[]) {
  const cartId = (await getCartId()) || (await getOrSetCart()).id
  const supabase = await createClient()

  for (const item of items) {
    let targetVariantId = item.variantId === item.productId ? undefined : item.variantId
    if (!targetVariantId) {
      const { data: variants } = await supabase
        .from("product_variants")
        .select("id")
        .eq("product_id", item.productId)
        .limit(1)

      if (variants && variants.length > 0) {
        targetVariantId = variants[0].id
      }
    }

    const { data: existingItems } = await supabase
      .from("cart_items")
      .select("*")
      .eq("cart_id", cartId)
      .eq("product_id", item.productId)
      .eq("variant_id", targetVariantId || null)

    const existingItem = existingItems?.[0]

    if (existingItem) {
      await supabase
        .from("cart_items")
        .update({ quantity: (existingItem.quantity || 0) + item.quantity })
        .eq("id", existingItem.id)
    } else {
      await supabase
        .from("cart_items")
        .insert({
          cart_id: cartId,
          product_id: item.productId,
          variant_id: targetVariantId || null,
          quantity: item.quantity,
          metadata: item.metadata ? JSON.parse(JSON.stringify(item.metadata)) : null
        })
    }
  }

  revalidateTag("cart", "max")
  return retrieveCartRaw(cartId)
}

export async function updateLineItem({
  lineId,
  quantity,
}: {
  lineId: string
  quantity: number
}) {
  const supabase = await createClient()
  await supabase
    .from("cart_items")
    .update({ quantity })
    .eq("id", lineId)

  revalidateTag("cart", "max")
  return retrieveCartRaw()
}


export async function deleteLineItem(lineId: string) {
  const supabase = await createClient()
  await supabase
    .from("cart_items")
    .delete()
    .eq("id", lineId)

  revalidateTag("cart", "max")
  return retrieveCartRaw()
}



// Background auto-save (no redirect) - Fixes blank page issue
export async function saveAddressesBackground(_currentState: unknown, formData: FormData) {
  const cart = await retrieveCart()
  if (!cart) return { message: "No cart found", success: false }

  const supabase = await createClient()

  const shippingPhone = formData.get("shipping_address.phone") as string
  if (!shippingPhone || shippingPhone.trim() === "") {
    return { message: "Phone number is required", success: false }
  }

  const data = {
    email: formData.get("email") as string,
    shipping_address: {
      first_name: formData.get("shipping_address.first_name"),
      last_name: formData.get("shipping_address.last_name"),
      address_1: formData.get("shipping_address.address_1"),
      company: formData.get("shipping_address.company"),
      postal_code: formData.get("shipping_address.postal_code"),
      city: formData.get("shipping_address.city"),
      country_code: formData.get("shipping_address.country_code"),
      province: formData.get("shipping_address.province"),
      phone: formData.get("shipping_address.phone"),
    },
    billing_address: {
      first_name: formData.get("billing_address.first_name") || formData.get("shipping_address.first_name"),
      last_name: formData.get("billing_address.last_name") || formData.get("shipping_address.last_name"),
      address_1: formData.get("billing_address.address_1") || formData.get("shipping_address.address_1"),
      company: formData.get("billing_address.company") || formData.get("shipping_address.company"),
      postal_code: formData.get("billing_address.postal_code") || formData.get("shipping_address.postal_code"),
      city: formData.get("billing_address.city") || formData.get("shipping_address.city"),
      country_code: formData.get("billing_address.country_code") || formData.get("shipping_address.country_code"),
      province: formData.get("billing_address.province") || formData.get("shipping_address.province"),
      phone: formData.get("billing_address.phone") || formData.get("shipping_address.phone"),
    }
  }

  const { error } = await supabase
    .from("carts")
    .update(data)
    .eq("id", cart.id)

  if (error) {
    return { message: error.message, success: false }
  }

  // Claim cart for user if not already linked
  const { data: { user } } = await supabase.auth.getUser()
  if (user && !cart.user_id) {
    await supabase.from("carts").update({ user_id: user.id }).eq("id", cart.id)
  }

  // Save address to profile if requested
  const saveToProfile = formData.get("save_address") === "on"
  if (saveToProfile && user) {
    try {
      // Check if this exact address already exists for the user to avoid duplicates
      const { data: existingAddresses, error: fetchError } = await supabase
        .from("addresses")
        .select("id")
        .eq("user_id", user.id)
        .eq("address_1", data.shipping_address.address_1)
        .eq("postal_code", data.shipping_address.postal_code)
        .maybeSingle()

      if (!fetchError && !existingAddresses) {
        await supabase.from("addresses").insert({
          user_id: user.id,
          first_name: data.shipping_address.first_name,
          last_name: data.shipping_address.last_name,
          address_1: data.shipping_address.address_1,
          company: data.shipping_address.company,
          postal_code: data.shipping_address.postal_code,
          city: data.shipping_address.city,
          country_code: data.shipping_address.country_code,
          province: data.shipping_address.province,
          phone: data.shipping_address.phone,
        })
      }
    } catch (e) {
      console.error("Failed to save address to profile:", e)
    }
  }

  // Update shipping method automatically
  await autoSelectStandardShipping(cart.id)

  revalidateTag("cart", "max")
  revalidateTag("customers", "max")
  return { message: "Saved", success: true }
}

export async function autoSelectStandardShipping(cartId: string, skipRevalidate = false) {
  const { shipping_options } = await listCartOptions()
  // Auto-select first option if available (Standard Shipping)
  if (shipping_options.length > 0) {
    return await setShippingMethod({ cartId, shippingMethodId: shipping_options[0].id, skipRevalidate })
  }
  return null
}

// Explicit submit with redirect - Skips delivery step as we auto-select
export async function submitAddresses(formData: FormData) {
  // Pass null as state since saveAddressesBackground expects it
  const result = await saveAddressesBackground(null, formData)

  if (!result.success) {
    // If save fails, we return the result. In a server action used in formAction, 
    // we can't easily return data to the client without useActionState.
    // However, since we are redirecting on success, if we don't redirect, 
    // it means failure. We might want to throw or handle error better, 
    // but for now let's just match the signature.
    throw new Error(result.message)
  }

  const cart = await retrieveCart()
  if (cart) {
    await autoSelectStandardShipping(cart.id)
  }

  redirect("/checkout?step=payment")
}

export async function setShippingMethod({
  cartId,
  shippingMethodId,
  skipRevalidate = false
}: {
  cartId: string,
  shippingMethodId: string,
  skipRevalidate?: boolean
}) {
  const supabase = await createClient()

  const { shipping_options } = await listCartOptions()
  const option = shipping_options.find(o => o.id === shippingMethodId)

  const methodData = {
    id: shippingMethodId, // Use option ID as method ID for internal tracking
    shipping_option_id: shippingMethodId,
    name: option?.name || "Standard Shipping",
    amount: option?.amount || 0,
    price_type: (option?.price_type || "flat") as "flat" | "calculated",
    min_order_free_shipping: option?.min_order_free_shipping ?? null
  }

  const { error } = await supabase
    .from("carts")
    .update({
      shipping_methods: [methodData],
      updated_at: new Date().toISOString()
    })
    .eq("id", cartId)

  if (error) throw new Error(error.message)

  if (!skipRevalidate) {
    revalidateTag("cart", "max")
  }

  return methodData
}

export async function setPaymentProvider(providerId: string) {
  const cartId = await getCartId()
  if (!cartId) return

  const supabase = await createClient()

  const paymentCollection = {
    payment_sessions: [{
      provider_id: providerId,
      status: "pending",
      data: {}
    }]
  }

  const { error } = await supabase
    .from("carts")
    .update({
      payment_collection: paymentCollection as any
    })
    .eq("id", cartId)

  if (error) {
    console.error("Error setting payment provider:", error)
    throw new Error(error.message)
  }

  revalidateTag("cart", "max")
  revalidatePath("/checkout")
}

export async function initiatePaymentSession(cartInput: { id: string }, data: { provider_id: string, data?: Record<string, unknown> }) {
  const supabase = await createClient()
  const cart = await retrieveCart(cartInput.id)
  if (!cart) throw new Error("Cart not found")

  let sessionData = data.data || {}

  if (data.provider_id === "pp_payu_payu") {
    // 1. Retrieve keys from Environment Variables (Vercel)
    const key = process.env.PAYU_MERCHANT_KEY
    const salt = process.env.PAYU_MERCHANT_SALT
    const isTestMode = process.env.PAYU_ENVIRONMENT === "test"

    if (!key || !salt) {
      throw new Error("PayU configuration missing: PAYU_MERCHANT_KEY or PAYU_MERCHANT_SALT not set.")
    }

    // 2. Format Data for PayU
    const txnid = `txn${Date.now()}`
    const amount = Number(cart.total || 0).toFixed(2) // Strictly 2 decimal places
    const productinfo = "Store_Order"
    const firstname = (cart.shipping_address?.first_name || "Guest").trim().replace(/[^a-zA-Z0-9 ]/g, "")
    const email = (cart.email || "guest@toycker.in").trim()
    const phone = (cart.shipping_address?.phone || "9999999999").replace(/\D/g, "")

    const baseUrl = getBaseURL()

    // 3. Prepare Hash Parameters
    const hashParams: PayUHashParams = {
      key,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      udf1: cart.id, // Storing Cart ID in UDF1 for tracking
      udf2: "",
      udf3: "",
      udf4: "",
      udf5: ""
    }

    const hash = generatePayUHash(hashParams, salt)

    // 4. Construct Payment Session Data
    sessionData = {
      payment_url: isTestMode ? "https://test.payu.in/_payment" : "https://secure.payu.in/_payment",
      params: {
        ...hashParams,
        hash,
        surl: `${baseUrl}/api/payu/callback`,
        furl: `${baseUrl}/api/payu/callback`,
        phone
        // Note: service_provider: "payu_paisa" removed - deprecated since 2016
      }
    }
  }

  const paymentCollection = {
    payment_sessions: [{
      provider_id: data.provider_id,
      status: "pending",
      data: sessionData
    }]
  }

  const { error } = await supabase
    .from("carts")
    .update({
      payment_collection: paymentCollection as PaymentCollection
    })
    .eq("id", cart.id)

  if (error) throw new Error(error.message)

  revalidateTag("cart", "max")
  revalidatePath("/checkout")
}

export async function placeOrder() {
  const cart = await retrieveCart()
  if (!cart) throw new Error("No cart found")

  const supabase = await createClient()

  // Calculate proper totals from cart
  const item_subtotal = cart.item_subtotal ?? cart.subtotal ?? 0
  const shipping_total = cart.shipping_total ?? 0
  const tax_total = cart.tax_total ?? 0
  const discount_total = cart.discount_total ?? 0
  const gift_card_total = cart.gift_card_total ?? 0
  const rewards_discount = cart.rewards_discount ?? 0
  const total = cart.total ?? (item_subtotal + shipping_total + tax_total - discount_total - gift_card_total - rewards_discount)

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: cart.user_id,
      customer_email: cart.email || "guest@toycker.in",
      email: cart.email || "guest@toycker.in",
      total_amount: total,
      total: total,
      subtotal: item_subtotal,
      tax_total: tax_total,
      shipping_total: shipping_total,
      discount_total: discount_total + rewards_discount,
      gift_card_total: gift_card_total,
      currency_code: cart.currency_code,
      status: "order_placed",
      payment_status: "captured",
      fulfillment_status: "not_shipped",
      shipping_address: cart.shipping_address,
      billing_address: cart.billing_address,
      items: JSON.parse(JSON.stringify(cart.items || [])),
      shipping_methods: JSON.parse(JSON.stringify(cart.shipping_methods || [])),
      promo_code: cart.promotions?.[0]?.code || null,
      metadata: {
        cart_id: cart.id,
        rewards_used: rewards_discount,
        promo_code: cart.promotions?.[0]?.code || null
      }
    })
    .select()
    .single()

  if (orderError) throw new Error(orderError.message)

  // Log "Order Placed" event
  const { logOrderEvent } = await import("@lib/data/admin")
  await logOrderEvent(
    order.id,
    "order_placed",
    "Order Placed",
    "Customer placed this order.",
    "customer"
  )

  // Handle post-order logic (rewards, membership, etc.)
  await handlePostOrderLogic(order, cart, rewards_discount)

  revalidateTag("rewards", "max")
  revalidateTag("cart", "max")

  redirect(`/order/confirmed/${order.id}`)
}

/**
 * Reusable helper to handle post-order logic like membership activation, 
 * rewards calculation, and event logging.
 */
export async function handlePostOrderLogic(order: any, cart: any, rewards_discount: number) {
  const supabase = await createClient()

  // Handle rewards and club functionality for logged-in users
  if (order.user_id) {
    const { checkAndActivateMembership, getClubSettings } = await import("@lib/data/club")
    const { creditRewards, deductRewards } = await import("@lib/data/rewards")
    const settings = await getClubSettings()

    // 1. Deduct reward points used
    if (rewards_discount > 0) {
      await deductRewards(order.user_id, order.id, rewards_discount)
    }

    // 2. Check for club membership activation (if threshold reached)
    const activated = await checkAndActivateMembership(order.user_id, order.total)
    if (activated) {
      revalidateTag("customers", "max")
    }

    // 3. Credit new rewards for club members
    const user = await getAuthUser()
    const isClubMember = user?.user_metadata?.is_club_member === true || activated

    if (isClubMember && settings.rewards_percentage > 0) {
      const pointsEarned = await creditRewards(
        order.user_id,
        order.id,
        order.subtotal, // Points based on subtotal, not including shipping
        settings.rewards_percentage
      )

      // Update order metadata with rewards info
      await supabase.from("orders").update({
        metadata: {
          ...(order.metadata || {}),
          newly_activated_club_member: activated,
          club_discount_percentage: settings.discount_percentage,
          rewards_earned: pointsEarned,
          rewards_used: rewards_discount
        }
      }).eq("id", order.id)
    } else if (activated) {
      await supabase.from("orders").update({
        metadata: {
          ...(order.metadata || {}),
          newly_activated_club_member: true,
          club_discount_percentage: settings.discount_percentage
        }
      }).eq("id", order.id)
    }

    // 4. Persist Lifetime Club Savings
    if (cart.club_savings && cart.club_savings > 0) {
      const currentSavings = Number(user?.user_metadata?.total_club_savings || 0)
      const newSavings = currentSavings + cart.club_savings

      await supabase.auth.updateUser({
        data: {
          total_club_savings: newSavings
        }
      })

      // Sync to profiles table for admin accessibility
      await supabase.from("profiles").update({
        total_club_savings: newSavings
      }).eq("id", order.user_id)
    }
  }

  // 5. Update promotion use count
  const promo_code = order.promo_code || cart.promotions?.[0]?.code
  if (promo_code) {
    const { data: promotion } = await supabase
      .from("promotions")
      .select("id")
      .eq("code", promo_code)
      .maybeSingle()

    if (promotion) {
      await supabase.rpc('increment_promotion_uses', { promo_id: promotion.id })
    }
  }
}


export async function createBuyNowCart({
  variantId,
  productId,
  quantity,
  countryCode: _countryCode,
  metadata
}: {
  variantId?: string | null
  productId?: string
  quantity: number
  countryCode: string
  metadata?: Record<string, unknown>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const newCartId = randomUUID()

  const { error } = await supabase.from("carts").insert({
    id: newCartId,
    user_id: user?.id || null,
    currency_code: "inr",
    email: user?.email || null
  })

  if (error) throw new Error(error.message)

  let targetProductId = productId || ""

  if (variantId && !targetProductId) {
    const { data: variant } = await supabase.from("product_variants").select("product_id").eq("id", variantId).single()
    if (variant) targetProductId = variant.product_id
  }

  if (targetProductId) {
    // Insert main product
    await supabase.from("cart_items").insert({
      cart_id: newCartId,
      product_id: targetProductId,
      variant_id: variantId || null,
      quantity: quantity,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null
    })

    // If gift wrap is selected, add as a separate line
    if (metadata && metadata.gift_wrap === true) {
      await supabase.from("cart_items").insert({
        cart_id: newCartId,
        product_id: targetProductId,
        variant_id: null,
        quantity: 1,
        metadata: {
          gift_wrap_line: true,
          gift_wrap_fee: metadata.gift_wrap_fee || 50,
          parent_line_id: `parent-${variantId || productId}`
        }
      })
    }
  }

  await setCartId(newCartId)
  revalidateTag("cart", "max")
  redirect("/checkout?step=address")
}

export async function listCartOptions(): Promise<{ shipping_options: ShippingOption[] }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("shipping_options")
    .select("*")
    .eq("is_active", true)

  if (error) {
    console.error("Error fetching shipping options:", error.message)
    return { shipping_options: [] }
  }

  return {
    shipping_options: (data || []).map((opt: ShippingOption) => ({
      id: opt.id,
      name: opt.name,
      amount: opt.amount,
      min_order_free_shipping: opt.min_order_free_shipping,
      price_type: "flat",
      prices: [{ amount: opt.amount, currency_code: "inr" }]
    }))
  }
}

export async function updateRegion(countryCode: string, currentPath: string) {
  redirect(currentPath)
}

export async function applyPromotions(codes: string[]) {
  const cartId = await getCartId()
  if (!cartId) throw new Error("No cart found")

  const supabase = await createClient()

  if (codes.length === 0) {
    const { error } = await supabase.from("carts").update({ promo_code: null, discount_total: 0 }).eq("id", cartId)
    if (error) throw new Error("Could not remove promotion code")
    revalidateTag("cart", "max")
    return
  }

  const code = codes[0].toUpperCase()

  // Verify code exists and is active
  const { data: promotion, error: promoError } = await supabase
    .from("promotions")
    .select("*")
    .eq("code", code)
    .eq("is_active", true)
    .eq("is_deleted", false)
    .maybeSingle()

  if (promoError || !promotion) {
    throw new Error("Invalid promotion code")
  }

  // Basic validation (dates and uses)
  const now = new Date()
  if (promotion.starts_at && new Date(promotion.starts_at) > now) {
    throw new Error("This promotion has not started yet")
  }
  if (promotion.ends_at && new Date(promotion.ends_at) < now) {
    throw new Error("This promotion has expired")
  }
  if (promotion.max_uses !== null && promotion.used_count >= promotion.max_uses) {
    throw new Error("This promotion has reached its usage limit")
  }

  // Check min order amount against current cart
  const cart = await retrieveCart(cartId)
  if (cart && (cart.item_subtotal ?? 0) < (promotion.min_order_amount || 0)) {
    throw new Error(`Minimum order amount of ₹${promotion.min_order_amount} required to use this code`)
  }

  // Calculate discount amount based on promotion type
  let discountAmount = 0
  const subtotal = cart?.item_subtotal ?? 0

  if (promotion.type === "percentage") {
    discountAmount = Math.round((subtotal * promotion.value) / 100)
  } else if (promotion.type === "fixed") {
    discountAmount = promotion.value
  }
  // For free_shipping, discount_amount stays 0 (shipping discount handled separately)

  // Update both promo_code and discount_total
  const { error } = await supabase
    .from("carts")
    .update({
      promo_code: code,
      discount_total: discountAmount
    })
    .eq("id", cartId)

  if (error) throw new Error("Could not apply promotion code")

  revalidateTag("cart", "max")
}
export async function updateCartRewards(points: number) {
  const cartId = await getCartId()
  if (!cartId) throw new Error("No cart found")

  const supabase = await createClient()

  const { data: cart } = await supabase
    .from("carts")
    .select("metadata")
    .eq("id", cartId)
    .single()

  const metadata = {
    ...(cart?.metadata || {}),
    rewards_to_apply: points
  }

  const { error } = await supabase
    .from("carts")
    .update({ metadata })
    .eq("id", cartId)

  if (error) throw new Error("Could not update rewards")

  revalidateTag("cart", "max")
}
