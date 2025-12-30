"use server"

import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import { Cart, CartItem, ShippingOption, Address, Product, ProductVariant, PaymentCollection } from "@/lib/supabase/types"
import { revalidateTag, revalidatePath } from "next/cache"
import { getCartId, setCartId, removeCartId } from "./cookies"
import { randomUUID } from "crypto"
import { redirect } from "next/navigation"
import { generatePayUHash, PayUHashParams } from "@/lib/payu"
import { getBaseURL } from "@/lib/util/env"

// Addresses interface for type safety
interface AddressFormData {
  email: string
  shipping_address: Address
  billing_address: Address
}

/** Raw cart item from database with nested product/variant objects */
interface DatabaseCartItem {
  id: string
  cart_id: string
  product_id: string
  variant_id: string
  quantity: number
  created_at: string
  updated_at: string
  product: Product | null
  variant: ProductVariant | null
  metadata?: Record<string, unknown>
}

/** Shipping method stored in cart */
interface CartShippingMethod {
  shipping_option_id: string
  name: string
  amount: number
}

const mapCartItems = (items: DatabaseCartItem[], clubDiscountPercentage = 0): CartItem[] => {
  return items.map((item) => {
    const product = item.product
    const variant = item.variant

    let thumbnail = product?.image_url
    if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
      const firstImg = product.images[0]
      // Handle both string and object image formats
      if (typeof firstImg === 'string') {
        thumbnail = firstImg
      } else if (firstImg && typeof firstImg === 'object' && 'url' in firstImg) {
        thumbnail = (firstImg as { url: string }).url || thumbnail
      }
    }

    const originalPrice = Number(variant?.price || 0)
    const hasClubDiscount = clubDiscountPercentage > 0
    const discountedPrice = hasClubDiscount
      ? Math.round(originalPrice * (1 - clubDiscountPercentage / 100))
      : originalPrice

    return {
      ...item,
      title: variant?.title || product?.name || "Product",
      product_title: product?.name || "Product",
      product_handle: product?.handle,
      thumbnail: thumbnail ?? undefined,
      unit_price: discountedPrice,
      original_unit_price: originalPrice,
      total: discountedPrice * item.quantity,
      original_total: originalPrice * item.quantity,
      subtotal: discountedPrice * item.quantity,
      has_club_discount: hasClubDiscount,
      product: product ?? undefined,
      variant: variant ?? undefined
    }
  })
}

export const retrieveCart = cache(async (cartId?: string): Promise<Cart | null> => {
  const id = cartId || (await getCartId())
  if (!id) return null

  const supabase = await createClient()
  const { data: cartData, error } = await supabase
    .from("carts")
    .select(`
      *,
      items:cart_items(
        *,
        product:products(*),
        variant:product_variants(*)
      )
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

  const { data: { user } } = await supabase.auth.getUser()
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

  const items = mapCartItems(cartData.items || [], clubDiscountPercentage)
  const item_subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const original_subtotal = items.reduce((sum, item) => sum + (item.original_total || item.total), 0)
  const club_savings = original_subtotal - item_subtotal

  const shippingMethods = cartData.shipping_methods as CartShippingMethod[] | null
  const shipping_total = Array.isArray(shippingMethods) && shippingMethods.length > 0
    ? Number(shippingMethods[0].amount || 0)
    : 0

  // Get rewards to apply from cart metadata
  const cartMetadata = (cartData.metadata || {}) as Record<string, unknown>
  const rewards_to_apply = Math.min(
    Number(cartMetadata.rewards_to_apply || 0),
    availableRewards,
    item_subtotal + shipping_total // Can't exceed order total
  )
  const rewards_discount = rewards_to_apply // 1 point = ₹1

  const tax_total = 0
  const total = Math.max(0, item_subtotal + tax_total + shipping_total - rewards_discount)

  const cart: Cart = {
    ...cartData,
    items,
    item_subtotal,
    subtotal: item_subtotal,
    tax_total,
    shipping_total,
    total,
    discount_total: 0,
    gift_card_total: 0,
    shipping_subtotal: shipping_total,
    // Club membership info
    club_savings,
    is_club_member: isClubMember,
    club_discount_percentage: clubDiscountPercentage,
    // Rewards
    rewards_to_apply,
    rewards_discount,
    available_rewards: availableRewards
  }

  return cart
})


export async function getOrSetCart(): Promise<Cart> {
  const existingCart = await retrieveCart()
  if (existingCart) return existingCart

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const newCartId = randomUUID()

  const { data: newCart, error } = await supabase
    .from("carts")
    .insert({
      id: newCartId,
      user_id: user?.id || null,
      currency_code: "inr",
      email: user?.email
    })
    .select()
    .single()

  if (error || !newCart) {
    throw new Error("Could not create cart")
  }

  await setCartId(newCart.id)
  revalidateTag("cart")

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
}: {
  productId: string
  quantity: number
  variantId?: string
}) {
  const cart = await getOrSetCart()
  const supabase = await createClient()

  let targetVariantId = variantId
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

  if (!targetVariantId) {
    throw new Error("Product has no variants")
  }

  const { data: existingItem } = await supabase
    .from("cart_items")
    .select("*")
    .eq("cart_id", cart.id)
    .eq("variant_id", targetVariantId)
    .maybeSingle()

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
        cart_id: cart.id,
        product_id: productId,
        variant_id: targetVariantId,
        quantity,
      })
  }

  revalidateTag("cart")
  return retrieveCart(cart.id)
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

  revalidateTag("cart")
  return retrieveCart()
}

export async function deleteLineItem(lineId: string) {
  const supabase = await createClient()
  await supabase
    .from("cart_items")
    .delete()
    .eq("id", lineId)

  revalidateTag("cart")
  return retrieveCart()
}



// Background auto-save (no redirect) - Fixes blank page issue
export async function saveAddressesBackground(_currentState: unknown, formData: FormData) {
  const cart = await retrieveCart()
  if (!cart) return { message: "No cart found", success: false }

  const supabase = await createClient()

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

  // Update shipping method automatically
  await autoSelectStandardShipping(cart.id)

  revalidateTag("cart")
  return { message: "Saved", success: true }
}

export async function autoSelectStandardShipping(cartId: string) {
  const { shipping_options } = await listCartOptions()
  // Auto-select first option if available (Standard Shipping)
  if (shipping_options.length > 0) {
    await setShippingMethod({ cartId, shippingMethodId: shipping_options[0].id })
  }
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

export async function setShippingMethod({ cartId, shippingMethodId }: { cartId: string, shippingMethodId: string }) {
  const supabase = await createClient()

  const { shipping_options } = await listCartOptions()
  const option = shipping_options.find(o => o.id === shippingMethodId)

  const methodData = {
    shipping_option_id: shippingMethodId,
    name: option?.name || "Standard Shipping",
    amount: option?.amount || 0
  }

  const { error } = await supabase
    .from("carts")
    .update({
      shipping_methods: [methodData],
      updated_at: new Date().toISOString()
    })
    .eq("id", cartId)

  if (error) throw new Error(error.message)
  revalidateTag("cart")
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

  revalidateTag("cart")
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
      status: "paid",
      payment_status: "captured",
      fulfillment_status: "not_shipped",
      shipping_address: cart.shipping_address,
      billing_address: cart.billing_address,
      items: JSON.parse(JSON.stringify(cart.items || [])),
      shipping_methods: JSON.parse(JSON.stringify(cart.shipping_methods || [])),
      metadata: {
        cart_id: cart.id,
        rewards_used: rewards_discount
      }
    })
    .select()
    .single()

  if (orderError) throw new Error(orderError.message)

  // Handle rewards for club members
  if (order.user_id) {
    const { checkAndActivateMembership, getClubSettings } = await import("@lib/data/club")
    const { creditRewards, deductRewards } = await import("@lib/data/rewards")
    const settings = await getClubSettings()

    // First, deduct any rewards used
    if (rewards_discount > 0) {
      await deductRewards(order.user_id, order.id, rewards_discount)
    }

    // Check for club membership activation
    const activated = await checkAndActivateMembership(order.user_id, total)
    if (activated) {
      revalidateTag("customers")
    }

    // Credit new rewards for club members (check membership status after potential activation)
    const { data: { user } } = await supabase.auth.getUser()
    const isClubMember = user?.user_metadata?.is_club_member === true || activated

    if (isClubMember && settings.rewards_percentage > 0) {
      const pointsEarned = await creditRewards(
        order.user_id,
        order.id,
        item_subtotal, // Points based on subtotal, not including shipping
        settings.rewards_percentage
      )

      // Update order metadata with rewards info
      await supabase.from("orders").update({
        metadata: {
          ...order.metadata,
          newly_activated_club_member: activated,
          club_discount_percentage: settings.discount_percentage,
          rewards_earned: pointsEarned,
          rewards_used: rewards_discount
        }
      }).eq("id", order.id)
    } else if (activated) {
      await supabase.from("orders").update({
        metadata: { ...order.metadata, newly_activated_club_member: true, club_discount_percentage: settings.discount_percentage }
      }).eq("id", order.id)
    }

    revalidateTag("rewards")
  }

  await removeCartId()
  revalidateTag("cart")

  redirect(`/order/confirmed/${order.id}`)
}

export async function createBuyNowCart({
  variantId,
  quantity,
  countryCode,
  metadata
}: {
  variantId: string
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
    email: user?.email
  })

  if (error) throw new Error(error.message)

  const { data: variant } = await supabase.from("product_variants").select("product_id").eq("id", variantId).single()

  if (variant && variant.product_id) {
    await supabase.from("cart_items").insert({
      cart_id: newCartId,
      product_id: variant.product_id,
      variant_id: variantId,
      quantity: quantity,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null
    })
  }

  await setCartId(newCartId)
  revalidateTag("cart")
  return newCartId
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
      price_type: "flat",
      prices: [{ amount: opt.amount, currency_code: "inr" }]
    }))
  }
}

export async function updateRegion(countryCode: string, currentPath: string) {
  redirect(currentPath)
}

export async function applyPromotions(codes: string[]) {
  console.log("Applying promotions", codes)
}