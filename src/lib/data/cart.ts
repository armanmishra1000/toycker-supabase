"use server"

import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import { Product, Cart, CartItem } from "@/lib/supabase/types"
import { revalidateTag } from "next/cache"
import { getCartId, setCartId } from "./cookies"
import { randomUUID } from "crypto"

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
        product:products(*)
      )
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error retrieving cart:", error)
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
    const { data: newCart, error } = await supabase
      .from("carts")
      .insert({ id: newCartId, user_id: user?.id || null })
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
}: {
  productId: string
  quantity: number
}) {
  const cart = await getOrSetCart()
  const supabase = await createClient()

  const { data: existingItem } = await supabase
    .from("cart_items")
    .select("*")
    .eq("cart_id", cart.id)
    .eq("product_id", productId)
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
