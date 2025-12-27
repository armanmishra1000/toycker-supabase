"use server"

import { createClient } from "@/lib/supabase/server"
import { Product, Order, CustomerProfile, Collection, Category, PaymentProvider, ShippingOption } from "@/lib/supabase/types"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

// --- Auth Check ---
export async function ensureAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?next=/admin")
  }

  const ADMIN_EMAILS = ["admin@toycker.com", "tutanymo@fxzig.com"]
  const isHardcodedAdmin = ADMIN_EMAILS.includes(user.email || "")

  if (isHardcodedAdmin) {
    return
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    redirect("/")
  }
}

// --- Dashboard Stats ---
export async function getAdminStats() {
  await ensureAdmin()
  const supabase = await createClient()

  const { count: productsCount } = await supabase.from("products").select("*", { count: "exact", head: true })
  const { count: ordersCount } = await supabase.from("orders").select("*", { count: "exact", head: true })
  const { count: customersCount } = await supabase.from("profiles").select("*", { count: "exact", head: true })
  
  const { data: orders } = await supabase.from("orders").select("total_amount")
  const totalRevenue = orders?.reduce((acc, order) => acc + (order.total_amount || 0), 0) || 0

  return {
    products: productsCount || 0,
    orders: ordersCount || 0,
    customers: customersCount || 0,
    revenue: totalRevenue
  }
}

// --- Categories ---
export async function getAdminCategories() {
  await ensureAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase.from("categories").select("*").order("name")
  if (error) throw error
  return data as Category[]
}

export async function createCategory(formData: FormData) {
  await ensureAdmin()
  const supabase = await createClient()
  const category = {
    name: formData.get("name") as string,
    handle: formData.get("handle") as string,
    description: formData.get("description") as string || null,
  }
  const { error } = await supabase.from("categories").insert(category)
  if (error) throw new Error(error.message)
  revalidatePath("/admin/categories")
  redirect("/admin/categories")
}

export async function deleteCategory(id: string) {
  await ensureAdmin()
  const supabase = await createClient()
  await supabase.from("categories").delete().eq("id", id)
  revalidatePath("/admin/categories")
}

// --- Products ---
export async function getAdminProducts(status?: string) {
  await ensureAdmin()
  const supabase = await createClient()
  let query = supabase.from("products").select("*").order("created_at", { ascending: false })
  
  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) throw error
  return data as Product[]
}

export async function createProduct(formData: FormData) {
  await ensureAdmin()
  const supabase = await createClient()
  const product = {
    name: formData.get("name") as string,
    handle: formData.get("handle") as string,
    description: formData.get("description") as string,
    price: parseFloat(formData.get("price") as string),
    stock_count: parseInt(formData.get("stock_count") as string),
    image_url: formData.get("image_url") as string,
    collection_id: formData.get("collection_id") as string || null,
    status: (formData.get("status") as string) || 'active',
    currency_code: "inr",
  }
  const { error } = await supabase.from("products").insert(product)
  if (error) throw new Error(error.message)
  revalidatePath("/admin/products")
  redirect("/admin/products")
}

export async function updateProduct(formData: FormData) {
  await ensureAdmin()
  const supabase = await createClient()
  const id = formData.get("id") as string
  const updates = {
    name: formData.get("name") as string,
    handle: formData.get("handle") as string,
    description: formData.get("description") as string,
    price: parseFloat(formData.get("price") as string),
    stock_count: parseInt(formData.get("stock_count") as string),
    image_url: formData.get("image_url") as string,
    collection_id: formData.get("collection_id") as string || null,
    status: formData.get("status") as string,
  }
  const { error } = await supabase.from("products").update(updates).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/admin/products")
  redirect("/admin/products")
}

export async function deleteProduct(id: string) {
  await ensureAdmin()
  const supabase = await createClient()
  await supabase.from("products").delete().eq("id", id)
  revalidatePath("/admin/products")
}

// --- Collections ---
export async function getAdminCollections() {
  await ensureAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("collections")
    .select("*, products(count)")
    .order("created_at", { ascending: false })
  
  if (error) throw error
  return data as (Collection & { products: { count: number }[] })[]
}

export async function getAdminCollection(id: string) {
  await ensureAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase.from("collections").select("*").eq("id", id).single()
  if (error) throw error
  return data as Collection
}

export async function createCollection(formData: FormData) {
  await ensureAdmin()
  const supabase = await createClient()
  const collection = {
    title: formData.get("title") as string,
    handle: formData.get("handle") as string,
  }
  const { error } = await supabase.from("collections").insert(collection)
  if (error) throw new Error(error.message)
  revalidatePath("/admin/collections")
  redirect("/admin/collections")
}

export async function updateCollection(formData: FormData) {
  await ensureAdmin()
  const supabase = await createClient()
  const id = formData.get("id") as string
  const updates = {
    title: formData.get("title") as string,
    handle: formData.get("handle") as string,
  }
  const { error } = await supabase.from("collections").update(updates).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/admin/collections")
  redirect("/admin/collections")
}

export async function deleteCollection(id: string) {
  await ensureAdmin()
  const supabase = await createClient()
  await supabase.from("collections").delete().eq("id", id)
  revalidatePath("/admin/collections")
}

// --- Orders ---
export async function getAdminOrders() {
  await ensureAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false })
  if (error) throw error
  return data as Order[]
}

export async function getAdminOrder(id: string) {
  await ensureAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase.from("orders").select("*").eq("id", id).single()
  if (error) throw error
  return data as Order
}

export async function updateOrderStatus(id: string, status: string) {
  await ensureAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from("orders").update({ status }).eq("id", id)
  if (error) throw error
  revalidatePath(`/admin/orders/${id}`)
  revalidatePath("/admin/orders")
}

// --- Customers ---
export async function getAdminCustomers() {
  await ensureAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })
  if (error) throw error
  return data as CustomerProfile[]
}

export async function getAdminCustomer(id: string) {
  await ensureAdmin()
  const supabase = await createClient()
  const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", id).single()
  if (profileError) throw profileError
  
  const { data: orders } = await supabase.from("orders").select("*").eq("user_id", id).order("created_at", { ascending: false })
  
  return {
    ...profile,
    orders: orders || []
  }
}

// --- Payment Methods ---
export async function getAdminPaymentMethods() {
  await ensureAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("payment_providers")
    .select("*")
    .order("created_at", { ascending: false })
  
  if (error) throw error
  return data as PaymentProvider[]
}

export async function createPaymentMethod(formData: FormData) {
  await ensureAdmin()
  const supabase = await createClient()
  const method = {
    id: formData.get("id") as string,
    name: formData.get("name") as string,
    description: formData.get("description") as string || null,
    is_active: true,
  }
  
  const { error } = await supabase.from("payment_providers").insert(method)
  if (error) throw new Error(error.message)
  
  revalidatePath("/admin/payments")
  redirect("/admin/payments")
}

export async function deletePaymentMethod(id: string) {
  await ensureAdmin()
  const supabase = await createClient()
  await supabase.from("payment_providers").delete().eq("id", id)
  revalidatePath("/admin/payments")
}

// --- Shipping Methods ---
export async function getAdminShippingOptions() {
  await ensureAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("shipping_options")
    .select("*")
    .order("created_at", { ascending: false })
  
  if (error) throw error
  return data as ShippingOption[]
}

export async function createShippingOption(formData: FormData) {
  await ensureAdmin()
  const supabase = await createClient()
  const option = {
    name: formData.get("name") as string,
    amount: parseFloat(formData.get("amount") as string),
    is_active: true,
  }
  
  const { error } = await supabase.from("shipping_options").insert(option)
  if (error) throw new Error(error.message)
  
  revalidatePath("/admin/shipping")
  redirect("/admin/shipping")
}

export async function deleteShippingOption(id: string) {
  await ensureAdmin()
  const supabase = await createClient()
  await supabase.from("shipping_options").delete().eq("id", id)
  revalidatePath("/admin/shipping")
}