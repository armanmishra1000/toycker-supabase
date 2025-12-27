"use server"

import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import { Cart, CartItem } from "@/lib/supabase/types"
import { revalidateTag } from "next/cache"
import { getCartId, setCartId, removeCartId } from "./cookies"
import { randomUUID } from "crypto"
import { redirect } from "next/navigation"

// Helper to map raw DB cart items to application CartItem type
const mapCartItems = (items: any[]): CartItem[] => {
  return items.map((item) => {
    const product = item.product
    const variant = item.variant
    
    // Determine thumbnail
    let thumbnail = product?.image_url
    if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
       // Handle case where images might be array of strings or objects depending on query
       const firstImg = product.images[0]
       thumbnail = typeof firstImg === 'string' ? firstImg : firstImg?.url || thumbnail
    }

    return {
      ...item,
      // Map relations to flat properties expected by UI components
      title: variant?.title || product?.name || "Product",
      product_title: product?.name || "Product",
      product_handle: product?.handle,
      thumbnail: thumbnail,
      // Ensure prices are numbers
      unit_price: Number(variant?.price || 0),
      total: Number(variant?.price || 0) * item.quantity,
      subtotal: Number(variant?.price || 0) * item.quantity,
      // Preserve relations
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
  
  // Simple tax/shipping calculation for prototype
  const tax_total = 0
  const shipping_total = 0 // Will be calculated based on shipping method selection in real app
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
    shipping_subtotal: 0
  }

  return cart
})

export async function getOrSetCart() {
  let cart = await retrieveCart()

  if (!cart) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const newCartId = randomUUID()
    
    // Create a new cart
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

  // For prototype, if no variantId is provided, try to find the first variant
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
  
  // For prototype: update cart with shipping method ID
  const { error } = await supabase
    .from("carts")
    .update({ 
        shipping_method: shippingMethodId,
        updated_at: new Date().toISOString()
    })
    .eq("id", cartId)

  if (error) throw new Error(error.message)
  revalidateTag("cart")
}

export async function initiatePaymentSession(cart: any, data: any) {
  const supabase = await createClient()
  
  // Store the selected provider in metadata or a designated column
  // For prototype, we simulate a payment session
  const paymentCollection = { 
    payment_sessions: [{
        provider_id: data.provider_id,
        status: "pending",
        data: data.data || {}
    }]
  }

  await supabase
    .from("carts")
    .update({ 
        payment_collection: paymentCollection
    })
    .eq("id", cart.id)
    
  revalidateTag("cart")
}

export async function placeOrder() {
  const cart = await retrieveCart()
  if (!cart) throw new Error("No cart found")

  const supabase = await createClient()
  
  // 2. Create Order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_email: cart.email,
      total_amount: cart.total ?? 0,
      currency_code: cart.currency_code,
      status: "pending",
      payment_status: "awaiting",
      fulfillment_status: "not_shipped",
      shipping_address: cart.shipping_address,
      billing_address: cart.billing_address,
      items: cart.items, // Saving mapped items as JSONB
      metadata: { cart_id: cart.id }
    })
    .select()
    .single()

  if (orderError) throw new Error(orderError.message)

  // 3. Clear Cart Cookie
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

    // 1. Create temporary cart
    await supabase.from("carts").insert({
        id: newCartId,
        user_id: user?.id || null,
        currency_code: "inr",
        email: user?.email
    })

    // 2. Add item
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

    // 3. Set cookie
    await setCartId(newCartId)
    revalidateTag("cart")
    return newCartId
}

export async function listCartOptions() {
    // Return dummy shipping options for prototype
    return {
        shipping_options: [
            {
                id: "so_standard",
                name: "Standard Shipping",
                amount: 0,
                price_type: "flat",
                prices: [{ amount: 0, currency_code: "inr" }]
            },
            {
                id: "so_express",
                name: "Express Shipping",
                amount: 150,
                price_type: "flat",
                prices: [{ amount: 150, currency_code: "inr" }]
            }
        ]
    }
}

export async function updateRegion(countryCode: string, currentPath: string) {
    // Stub for region update
    redirect(currentPath)
}

export async function applyPromotions(codes: string[]) {
    console.log("Applying promotions", codes)
}