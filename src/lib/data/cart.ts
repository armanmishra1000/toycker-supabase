"use server"

import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import { Cart, CartItem } from "@/lib/supabase/types"
import { revalidateTag } from "next/cache"
import { getCartId, setCartId, removeCartId } from "./cookies"
import { randomUUID } from "crypto"
import { redirect } from "next/navigation"

export const retrieveCart = cache(async (cartId?: string) => {
  const id = cartId || (await getCartId())
  if (!id) return null

  const supabase = await createClient()
  const { data: cart, error } = await supabase
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

  if (error) {
    return null
  }

  return cart as Cart
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
  
  // In a real app, calculate cost based on method ID
  // For prototype, we just verify the method exists
  
  // Update cart with shipping method
  // We are storing it in metadata or a specific column for simplicity if a dedicated table isn't set up yet
  // Assuming a shipping_methods relation or column
  
  const { error } = await supabase
    .from("carts")
    .update({ 
        shipping_method: shippingMethodId, // Store simplified ID
        updated_at: new Date().toISOString()
    })
    .eq("id", cartId)

  if (error) throw new Error(error.message)
  revalidateTag("cart")
}

export async function initiatePaymentSession(cart: any, data: any) {
  // Prototype stub: Just acknowledge the intent
  const supabase = await createClient()
  
  // Store the selected provider
  await supabase
    .from("carts")
    .update({ 
        payment_collection: { 
            payment_sessions: [{
                provider_id: data.provider_id,
                status: "pending",
                data: data.data
            }]
        } 
    })
    .eq("id", cart.id)
    
  revalidateTag("cart")
}

export async function placeOrder() {
  const cartId = await getCartId()
  if (!cartId) throw new Error("No cart found")

  const supabase = await createClient()
  
  // 1. Get Cart
  const { data: cart } = await supabase
    .from("carts")
    .select("*, items:cart_items(*)")
    .eq("id", cartId)
    .single()

  if (!cart) throw new Error("Cart not found")

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
      items: cart.items, // Storing items as JSON for simplicity in this migration
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
        currency_code: "inr", // default
        email: user?.email
    })

    // 2. Add item
    // Find product ID from variant
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
    const cartId = await getCartId()
    if (cartId) {
        // update cart currency based on country mapping logic if needed
    }
    redirect(currentPath)
}

export async function applyPromotions(codes: string[]) {
    // Stub
    console.log("Applying promotions", codes)
}