"use server"

import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import { Cart, CartItem, ShippingOption } from "@/lib/supabase/types"
import { revalidateTag, revalidatePath } from "next/cache"
import { getCartId, setCartId, removeCartId } from "./cookies"
import { randomUUID } from "crypto"
import { redirect } from "next/navigation"
import { generatePayUHash } from "@/lib/payu"

// Helper to map raw DB cart items to application CartItem type
const mapCartItems = (items: any[]): CartItem[] => {
  return items.map((item) => {
    const product = item.product
    const variant = item.variant
    
    // Determine thumbnail
    let thumbnail = product?.image_url
    if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
       const firstImg = product.images[0]
       thumbnail = typeof firstImg === 'string' ? firstImg : firstImg?.url || thumbnail
    }

    return {
      ...item,
      title: variant?.title || product?.name || "Product",
      product_title: product?.name || "Product",
      product_handle: product?.handle,
      thumbnail: thumbnail,
      unit_price: Number(variant?.price || 0),
      total: Number(variant?.price || 0) * item.quantity,
      subtotal: Number(variant?.price || 0) * item.quantity,
      product: product,
      variant: variant
    }
  })
}

export const retrieveCart = cache(async (cartId?: string) => {
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
    .single()

  if (error || !cartData) {
    return null
  }

  // Calculate totals
  const items = mapCartItems(cartData.items || [])
  const item_subtotal = items.reduce((sum, item) => sum + item.total, 0)
  
  // Get shipping cost from saved methods
  const shipping_total = Array.isArray(cartData.shipping_methods) && cartData.shipping_methods.length > 0
    ? Number(cartData.shipping_methods[0].amount || 0)
    : 0

  const tax_total = 0
  const total = item_subtotal + tax_total + shipping_total

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
    shipping_subtotal: shipping_total
  }

  return cart
})

export async function getOrSetCart() {
  let cart = await retrieveCart()

  if (!cart) {
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

    if (error) {
      console.error("Error creating cart:", error)
      throw new Error("Could not create cart")
    }

    cart = { ...newCart, items: [] }
    await setCartId(newCart.id)
    revalidateTag("cart")
  }

  return cart
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
    .single()

  if (existingItem) {
    await supabase
      .from("cart_items")
      .update({ quantity: existingItem.quantity + quantity })
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

export async function setAddresses(currentState: unknown, formData: FormData) {
  const cartId = await getCartId()
  if (!cartId) return { message: "No cart found" }

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
    .eq("id", cartId)

  if (error) {
    return { message: error.message }
  }

  revalidateTag("cart")
  redirect("/checkout?step=delivery")
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

export async function initiatePaymentSession(cartInput: any, data: any) {
  const supabase = await createClient()
  
  // 1. Fetch fresh cart from DB to ensure we have the latest totals and shipping info
  const cart = await retrieveCart(cartInput.id)
  if (!cart) throw new Error("Cart not found")

  let sessionData = data.data || {}

  // If the provider is PayU, generate the required payload for the prototype
  if (data.provider_id === "pp_payu_payu") {
    const txnid = `tx_${Date.now()}`
    // Ensure amount is formatted correctly (2 decimal places)
    const amount = (cart.total || 0).toFixed(2)
    const productinfo = "Toycker Order"
    const firstname = cart.shipping_address?.first_name || "Customer"
    const email = cart.email || "test@example.com"
    
    // PayU Test Credentials
    // Default to the salt from the error message as it seems to be what the environment expects
    // If we are using the public test key 'gtKFFx', we FORCE the known test salt.
    let key = process.env.NEXT_PUBLIC_PAYU_MERCHANT_KEY || "gtKFFx"
    let salt = process.env.PAYU_MERCHANT_SALT || "4R38IvwiV57FwVpsgOvTXBdLE4tHUXFW"
    let saltV2 = process.env.PAYU_MERCHANT_SALT_V2

    // Force known test credentials if using public key, to avoid env var mismatches causing hash errors
    if (key === "gtKFFx") {
        salt = "4R38IvwiV57FwVpsgOvTXBdLE4tHUXFW"
        // Common V2 salt for this test key if available, otherwise undefined (user must provide if strictly required)
        // saltV2 = "..." 
    }

    const hashParams = {
      key,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      udf1: cart.id // Carry cart ID in user defined field
    }

    const hash = generatePayUHash(hashParams, salt, saltV2)

    sessionData = {
      payment_url: "https://test.payu.in/_payment",
      params: {
        ...hashParams,
        hash,
        surl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payu/callback`,
        furl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payu/callback`,
        phone: cart.shipping_address?.phone || "9999999999",
        service_provider: "payu_paisa"
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

  await supabase
    .from("carts")
    .update({ 
        payment_collection: paymentCollection
    })
    .eq("id", cart.id)
    
  revalidateTag("cart")
  revalidatePath("/checkout")
}

export async function placeOrder() {
  const cart = await retrieveCart()
  if (!cart) throw new Error("No cart found")

  const supabase = await createClient()
  
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_email: cart.email,
      total_amount: cart.total ?? 0,
      currency_code: cart.currency_code,
      status: "paid",
      payment_status: "captured",
      fulfillment_status: "not_shipped",
      shipping_address: cart.shipping_address,
      billing_address: cart.billing_address,
      items: cart.items,
      shipping_methods: cart.shipping_methods, 
      metadata: { cart_id: cart.id }
    })
    .select()
    .single()

  if (orderError) throw new Error(orderError.message)

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
    metadata?: any
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const newCartId = randomUUID()

    await supabase.from("carts").insert({
        id: newCartId,
        user_id: user?.id || null,
        currency_code: "inr",
        email: user?.email
    })

    const { data: variant } = await supabase.from("product_variants").select("product_id").eq("id", variantId).single()
    
    if (variant) {
        await supabase.from("cart_items").insert({
            cart_id: newCartId,
            product_id: variant.product_id,
            variant_id: variantId,
            quantity: quantity,
            metadata: metadata
        })
    }

    await setCartId(newCartId)
    revalidateTag("cart")
    return newCartId
}

export async function listCartOptions() {
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
    shipping_options: data.map((opt: ShippingOption) => ({
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