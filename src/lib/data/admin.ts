"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { Product, Order, CustomerProfile, Collection, Category, PaymentProvider, ShippingOption, OrderTimeline, ShippingPartner, OrderEventType, ProductVariant, VariantFormData, AdminRole, StaffMember } from "@/lib/supabase/types"
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

// --- Get Admin User ---
export async function getAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, email")
    .eq("id", user.id)
    .single()

  return {
    email: profile?.email || user.email || "",
    firstName: profile?.first_name || "",
    lastName: profile?.last_name || "",
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

interface GetAdminCategoriesParams {
  page?: number
  limit?: number
  search?: string
}

interface PaginatedCategoriesResponse {
  categories: Category[]
  count: number
  totalPages: number
  currentPage: number
}

export async function getAdminCategories(params: GetAdminCategoriesParams = {}): Promise<PaginatedCategoriesResponse> {
  await ensureAdmin()

  const { page = 1, limit = 20, search } = params
  const supabase = await createClient()

  // Calculate total count first
  let countQuery = supabase.from("categories").select("*", { count: "exact", head: true })

  if (search && search.trim()) {
    countQuery = countQuery.or(`name.ilike.%${search}%,handle.ilike.%${search}%`)
  }

  const { count } = await countQuery

  // Calculate pagination
  const offset = (page - 1) * limit
  const from = offset
  const to = offset + limit - 1
  const totalPages = count ? Math.ceil(count / limit) : 1

  // Fetch paginated data
  let query = supabase
    .from("categories")
    .select("*")
    .order("name")
    .range(from, to)

  if (search && search.trim()) {
    query = query.or(`name.ilike.%${search}%,handle.ilike.%${search}%`)
  }

  const { data, error } = await query
  if (error) throw error

  return {
    categories: (data || []) as Category[],
    count: count || 0,
    totalPages,
    currentPage: page
  }
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

interface GetAdminProductsParams {
  page?: number
  limit?: number
  status?: string
  search?: string
}

interface PaginatedProductsResponse {
  products: Product[]
  count: number
  totalPages: number
  currentPage: number
}

export async function getAdminProducts(params: GetAdminProductsParams = {}): Promise<PaginatedProductsResponse> {
  await ensureAdmin()

  const { page = 1, limit = 20, status, search } = params
  const supabase = await createClient()

  // Calculate total count first
  let countQuery = supabase.from("products").select("*", { count: "exact", head: true })

  if (status && status !== 'all') {
    countQuery = countQuery.eq('status', status)
  }

  if (search && search.trim()) {
    countQuery = countQuery.or(`name.ilike.%${search}%,handle.ilike.%${search}%`)
  }

  const { count } = await countQuery

  // Calculate pagination
  const offset = (page - 1) * limit
  const from = offset
  const to = offset + limit - 1
  const totalPages = count ? Math.ceil(count / limit) : 1

  // Fetch paginated data
  let query = supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })
    .range(from, to)

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  if (search && search.trim()) {
    query = query.or(`name.ilike.%${search}%,handle.ilike.%${search}%`)
  }

  const { data, error } = await query
  if (error) throw error

  return {
    products: (data || []) as Product[],
    count: count || 0,
    totalPages,
    currentPage: page
  }
}

export async function createProduct(formData: FormData) {
  await ensureAdmin()
  const supabase = await createClient()

  const collectionIds = formData.getAll("collection_ids") as string[]
  // Keep first collection_id for backwards compatibility or primary collection
  const primaryCollectionId = collectionIds.length > 0 ? collectionIds[0] : null

  // Get category_id
  const categoryId = formData.get("category_id") as string | null
  const categoryIdValue = categoryId && categoryId.trim() !== "" ? categoryId : null

  // Get compare_at_price
  const compareAtPrice = formData.get("compare_at_price") ? parseFloat(formData.get("compare_at_price") as string) : null

  const product = {
    name: formData.get("name") as string,
    handle: formData.get("handle") as string,
    description: formData.get("description") as string,
    price: parseFloat(formData.get("price") as string),
    stock_count: parseInt(formData.get("stock_count") as string),
    image_url: formData.get("image_url") as string,
    collection_id: primaryCollectionId, // Set primary collection
    category_id: categoryIdValue, // Set category
    status: (formData.get("status") as string) || 'active',
    currency_code: "inr",
    metadata: {
      compare_at_price: compareAtPrice,
    }
  }

  const { data: newProduct, error } = await supabase
    .from("products")
    .insert(product)
    .select("id")
    .single()

  if (error) throw new Error(error.message)

  // Insert multiple collection associations
  if (collectionIds.length > 0 && newProduct) {
    const collectionsToInsert = collectionIds.map(cid => ({
      product_id: newProduct.id,
      collection_id: cid
    }))

    const { error: collectionsError } = await supabase
      .from("product_collections")
      .insert(collectionsToInsert)

    if (collectionsError) {
      console.error("Error linking collections:", collectionsError)
      // Non-blocking error, but good to log
    }
  }

  revalidatePath("/admin/products")
  redirect("/admin/products")
}

export async function updateProduct(formData: FormData) {
  await ensureAdmin()
  const supabase = await createClient()
  const id = formData.get("id") as string

  const collectionIds = formData.getAll("collection_ids") as string[]
  // Keep first collection_id for backwards compatibility
  const primaryCollectionId = collectionIds.length > 0 ? collectionIds[0] : null

  // Get category_id
  const categoryId = formData.get("category_id") as string | null
  const categoryIdValue = categoryId && categoryId.trim() !== "" ? categoryId : null

  // Get current product to preserve existing metadata
  const { data: currentProduct } = await supabase.from("products").select("metadata").eq("id", id).single()

  const updates = {
    name: formData.get("name") as string,
    handle: formData.get("handle") as string,
    description: formData.get("description") as string,
    price: parseFloat(formData.get("price") as string),
    stock_count: parseInt(formData.get("stock_count") as string),
    image_url: formData.get("image_url") as string,
    collection_id: primaryCollectionId, // Update primary collection
    category_id: categoryIdValue, // Update category
    status: formData.get("status") as string,
    metadata: {
      ...(currentProduct?.metadata || {}),
      compare_at_price: formData.get("compare_at_price") ? parseFloat(formData.get("compare_at_price") as string) : null,
    }
  }

  const { error } = await supabase.from("products").update(updates).eq("id", id)
  if (error) throw new Error(error.message)

  // Update collections:
  // 1. Delete existing associations
  await supabase.from("product_collections").delete().eq("product_id", id)

  // 2. Insert new associations
  if (collectionIds.length > 0) {
    const collectionsToInsert = collectionIds.map(cid => ({
      product_id: id,
      collection_id: cid
    }))

    const { error: collectionsError } = await supabase
      .from("product_collections")
      .insert(collectionsToInsert)

    if (collectionsError) {
      console.error("Error updating product collections:", collectionsError)
    }
  }

  revalidatePath("/admin/products")
  revalidatePath(`/admin/products/${id}`)
  redirect(`/admin/products/${id}`)
}

export async function deleteProduct(id: string) {
  await ensureAdmin()
  const supabase = await createClient()
  await supabase.from("products").delete().eq("id", id)
  revalidatePath("/admin/products")
}

// --- Product Variants ---
export async function getProductVariants(productId: string) {
  await ensureAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", productId)
    .order("created_at")

  if (error) throw error
  return data as ProductVariant[]
}

export async function saveProductVariants(
  productId: string,
  variants: VariantFormData[]
) {
  await ensureAdmin()
  const supabase = await createClient()

  // Prepare variants for upsert
  const variantsToSave = variants.map(v => ({
    id: v.id || undefined, // Let DB generate if new
    product_id: productId,
    title: v.title,
    sku: v.sku || null,
    price: v.price,
    inventory_quantity: v.inventory_quantity,
    manage_inventory: true,
    allow_backorder: false,
  }))

  // Upsert all variants
  const { error } = await supabase
    .from("product_variants")
    .upsert(variantsToSave, { onConflict: "id" })

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/products/${productId}`)
  revalidatePath("/admin/products")
}

export async function deleteVariant(variantId: string) {
  await ensureAdmin()
  const supabase = await createClient()
  await supabase.from("product_variants").delete().eq("id", variantId)
}

// --- Collections ---

interface GetAdminCollectionsParams {
  page?: number
  limit?: number
  search?: string
}

interface PaginatedCollectionsResponse {
  collections: (Collection & { products: { count: number }[] })[]
  count: number
  totalPages: number
  currentPage: number
}

export async function getAdminCollections(params: GetAdminCollectionsParams = {}): Promise<PaginatedCollectionsResponse> {
  await ensureAdmin()

  const { page = 1, limit = 20, search } = params
  const supabase = await createClient()

  // Calculate total count first
  let countQuery = supabase.from("collections").select("*", { count: "exact", head: true })

  if (search && search.trim()) {
    countQuery = countQuery.or(`title.ilike.%${search}%,handle.ilike.%${search}%`)
  }

  const { count } = await countQuery

  // Calculate pagination
  const offset = (page - 1) * limit
  const from = offset
  const to = offset + limit - 1
  const totalPages = count ? Math.ceil(count / limit) : 1

  // Fetch paginated data
  let query = supabase
    .from("collections")
    .select("*, products(count)")
    .order("created_at", { ascending: false })
    .range(from, to)

  if (search && search.trim()) {
    query = query.or(`title.ilike.%${search}%,handle.ilike.%${search}%`)
  }

  const { data, error } = await query
  if (error) throw error

  return {
    collections: (data || []) as (Collection & { products: { count: number }[] })[],
    count: count || 0,
    totalPages,
    currentPage: page
  }
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

export async function getProductCollections(productId: string) {
  await ensureAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("product_collections")
    .select("collection_id, collections(*)")
    .eq("product_id", productId)

  if (error) {
    console.error("Error fetching product collections:", error)
    return []
  }

  // Flatten the structure to return just the collection objects
  // The join returns a single object for 'collections', not an array
  return data.map(item => item.collections as unknown as Collection).filter(Boolean)
}

// --- Orders ---

interface GetAdminOrdersParams {
  page?: number
  limit?: number
  search?: string
}

interface PaginatedOrdersResponse {
  orders: Order[]
  count: number
  totalPages: number
  currentPage: number
}

export async function getAdminOrders(params: GetAdminOrdersParams = {}): Promise<PaginatedOrdersResponse> {
  await ensureAdmin()

  const { page = 1, limit = 20, search } = params
  const supabase = await createClient()

  // Check if search is a number (order ID search)
  const searchNum = search && search.trim() ? parseInt(search, 10) : NaN

  if (!isNaN(searchNum)) {
    // Searching by order ID - fetch all orders and filter client-side
    const { data: allOrders, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error

    // Filter by display_id
    const filteredOrders = (allOrders || []).filter(order => order.display_id === searchNum)

    // Calculate pagination for filtered results
    const count = filteredOrders.length
    const totalPages = Math.ceil(count / limit) || 1
    const offset = (page - 1) * limit
    const paginatedOrders = filteredOrders.slice(offset, offset + limit)

    return {
      orders: paginatedOrders as Order[],
      count,
      totalPages,
      currentPage: page
    }
  }

  // Regular search (by email) or no search
  // Calculate total count first
  let countQuery = supabase.from("orders").select("*", { count: "exact", head: true })

  if (search && search.trim()) {
    // Search by customer_email
    countQuery = countQuery.ilike("customer_email", `%${search}%`)
  }

  const { count } = await countQuery

  // Calculate pagination
  const offset = (page - 1) * limit
  const from = offset
  const to = offset + limit - 1
  const totalPages = count ? Math.ceil(count / limit) : 1

  // Fetch paginated data
  let query = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .range(from, to)

  if (search && search.trim()) {
    // Search by customer_email
    query = query.ilike("customer_email", `%${search}%`)
  }

  const { data, error } = await query
  if (error) throw error

  return {
    orders: (data || []) as Order[],
    count: count || 0,
    totalPages,
    currentPage: page
  }
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

interface GetAdminCustomersParams {
  page?: number
  limit?: number
  search?: string
}

interface PaginatedCustomersResponse {
  customers: CustomerProfile[]
  count: number
  totalPages: number
  currentPage: number
}

export async function getAdminCustomers(params: GetAdminCustomersParams = {}): Promise<PaginatedCustomersResponse> {
  await ensureAdmin()

  const { page = 1, limit = 20, search } = params
  const supabase = await createClient()

  // Calculate total count first
  let countQuery = supabase.from("profiles").select("*", { count: "exact", head: true })

  if (search && search.trim()) {
    countQuery = countQuery.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { count } = await countQuery

  // Calculate pagination
  const offset = (page - 1) * limit
  const from = offset
  const to = offset + limit - 1
  const totalPages = count ? Math.ceil(count / limit) : 1

  // Fetch paginated data
  let query = supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .range(from, to)

  if (search && search.trim()) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data, error } = await query
  if (error) throw error

  return {
    customers: (data || []) as CustomerProfile[],
    count: count || 0,
    totalPages,
    currentPage: page
  }
}

export async function getAdminCustomer(id: string) {
  await ensureAdmin()
  const supabase = await createClient()

  // Club membership data is now synced to profiles table
  const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", id).single()
  if (profileError) throw profileError

  const { data: orders } = await supabase.from("orders").select("*").eq("user_id", id).order("created_at", { ascending: false })
  const { data: addresses } = await supabase.from("addresses").select("*").eq("user_id", id)
  const { data: wallet } = await supabase.from("reward_wallets").select("*").eq("user_id", id).maybeSingle()

  return {
    ...profile,
    orders: orders || [],
    addresses: addresses || [],
    reward_wallet: wallet || null,
    // Use fallback values if profile columns are null (though migration should handle this)
    is_club_member: profile.is_club_member || false,
    club_member_since: profile.club_member_since || null,
    total_club_savings: profile.total_club_savings || 0
  }
}

export async function deleteCustomer(id: string) {
  await ensureAdmin()
  const supabase = await createAdminClient()

  const { error } = await supabase.auth.admin.deleteUser(id)

  if (error) {
    throw error
  }

  revalidatePath("/admin/customers")
  redirect("/admin/customers")
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
    min_order_free_shipping: formData.get("min_order_free_shipping")
      ? parseFloat(formData.get("min_order_free_shipping") as string)
      : null,
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

// --- Shipping Partners ---
export async function getShippingPartners() {
  await ensureAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("shipping_partners")
    .select("*")
    .order("name")

  if (error) throw error
  return data as ShippingPartner[]
}

export async function getActiveShippingPartners() {
  await ensureAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("shipping_partners")
    .select("*")
    .eq("is_active", true)
    .order("name")

  if (error) throw error
  return data as ShippingPartner[]
}

export async function createShippingPartner(formData: FormData) {
  await ensureAdmin()
  const supabase = await createClient()
  const partner = {
    name: formData.get("name") as string,
    is_active: true,
  }

  const { error } = await supabase.from("shipping_partners").insert(partner)
  if (error) throw new Error(error.message)

  revalidatePath("/admin/shipping-partners")
  redirect("/admin/shipping-partners")
}

export async function deleteShippingPartner(id: string) {
  await ensureAdmin()
  const supabase = await createClient()
  await supabase.from("shipping_partners").delete().eq("id", id)
  revalidatePath("/admin/shipping-partners")
}

// --- Order Timeline ---
export async function getOrderTimeline(orderId: string) {
  await ensureAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("order_timeline")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data as OrderTimeline[]
}

export async function logOrderEvent(
  orderId: string,
  eventType: OrderEventType,
  title: string,
  description: string,
  actor: string = "admin",
  metadata: Record<string, unknown> = {}
) {
  const supabase = await createClient()
  const { error } = await supabase.from("order_timeline").insert({
    order_id: orderId,
    event_type: eventType,
    title,
    description,
    actor,
    metadata,
  })

  if (error) {
    console.error("Error logging order event:", error)
  }
}

// --- Order Fulfillment ---
export async function fulfillOrder(orderId: string, formData: FormData) {
  await ensureAdmin()
  const supabase = await createClient()

  const shippingPartnerId = formData.get("shipping_partner_id") as string
  const trackingNumber = formData.get("tracking_number") as string | null

  // Get shipping partner name for timeline
  let partnerName = "Unknown"
  if (shippingPartnerId) {
    const { data: partner } = await supabase
      .from("shipping_partners")
      .select("name")
      .eq("id", shippingPartnerId)
      .single()
    partnerName = partner?.name || "Unknown"
  }

  // Update order
  const { error } = await supabase
    .from("orders")
    .update({
      fulfillment_status: "shipped",
      shipping_partner_id: shippingPartnerId,
      tracking_number: trackingNumber || null,
    })
    .eq("id", orderId)

  if (error) throw new Error(error.message)

  // Log timeline event
  const description = trackingNumber
    ? `Order shipped via ${partnerName}. Tracking: ${trackingNumber}`
    : `Order shipped via ${partnerName}.`

  await logOrderEvent(
    orderId,
    "shipped",
    "Order Shipped",
    description,
    "admin",
    { shipping_partner: partnerName, tracking_number: trackingNumber }
  )

  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath("/admin/orders")
}

// --- Get Customer Display ID ---
export async function getCustomerDisplayId(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("customer_display_id")
    .eq("id", userId)
    .single()

  if (error || !data?.customer_display_id) return null
  return data.customer_display_id
}

// --- Admin Roles ---
export async function getAdminRoles() {
  await ensureAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("admin_roles")
    .select("*")
    .order("created_at")

  if (error) throw error
  return data as AdminRole[]
}

export async function createRole(formData: FormData) {
  await ensureAdmin()
  const supabase = await createClient()

  const name = formData.get("name") as string
  const permissionsStr = formData.get("permissions") as string
  const permissions = permissionsStr ? JSON.parse(permissionsStr) as string[] : []

  const { error } = await supabase.from("admin_roles").insert({
    name,
    permissions,
    is_system: false,
  })

  if (error) throw new Error(error.message)
  revalidatePath("/admin/team/roles")
  redirect("/admin/team/roles")
}

export async function deleteRole(id: string) {
  await ensureAdmin()
  const supabase = await createClient()

  // Check if role is system role
  const { data: role } = await supabase
    .from("admin_roles")
    .select("is_system")
    .eq("id", id)
    .single()

  if (role?.is_system) {
    throw new Error("Cannot delete system roles")
  }

  await supabase.from("admin_roles").delete().eq("id", id)
  revalidatePath("/admin/team/roles")
}

// --- Staff Management ---

interface GetStaffMembersParams {
  page?: number
  limit?: number
  search?: string
}

interface PaginatedStaffMembersResponse {
  staff: StaffMember[]
  count: number
  totalPages: number
  currentPage: number
}

export async function getStaffMembers(params: GetStaffMembersParams = {}): Promise<PaginatedStaffMembersResponse> {
  await ensureAdmin()
  const supabase = await createClient()

  const { page = 1, limit = 20, search } = params

  // Calculate total count first
  let countQuery = supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .not("admin_role_id", "is", null)

  if (search && search.trim()) {
    countQuery = countQuery.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { count } = await countQuery

  // Calculate pagination
  const offset = (page - 1) * limit
  const from = offset
  const to = offset + limit - 1
  const totalPages = count ? Math.ceil(count / limit) : 1

  // Fetch paginated data
  let query = supabase
    .from("profiles")
    .select(`
      id,
      email,
      first_name,
      last_name,
      admin_role_id,
      created_at,
      admin_role:admin_roles(*)
    `)
    .not("admin_role_id", "is", null)
    .order("created_at", { ascending: false })
    .range(from, to)

  if (search && search.trim()) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data, error } = await query
  if (error) throw error

  return {
    staff: (data || []) as StaffMember[],
    count: count || 0,
    totalPages,
    currentPage: page
  }
}

export async function inviteStaffMember(email: string, roleId: string) {
  await ensureAdmin()
  const supabaseAdmin = await createAdminClient()

  // Invite user via Supabase Auth Admin
  const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin`,
    data: {
      admin_role_id: roleId,
    }
  })

  if (inviteError) throw new Error(inviteError.message)

  // Update the profile with role
  if (inviteData?.user) {
    await supabaseAdmin
      .from("profiles")
      .update({ admin_role_id: roleId })
      .eq("id", inviteData.user.id)
  }

  revalidatePath("/admin/team")
  return { success: true }
}

export async function updateStaffRole(userId: string, roleId: string) {
  await ensureAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from("profiles")
    .update({ admin_role_id: roleId, role: "admin" })
    .eq("id", userId)

  if (error) throw new Error(error.message)
  revalidatePath("/admin/team")
}

export async function removeStaffAccess(userId: string) {
  await ensureAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from("profiles")
    .update({ admin_role_id: null, role: null })
    .eq("id", userId)

  if (error) throw new Error(error.message)
  revalidatePath("/admin/team")
}

export async function getRegisteredUsers(searchQuery?: string) {
  await ensureAdmin()
  const supabase = await createClient()

  let query = supabase
    .from("profiles")
    .select("id, email, first_name, last_name, created_at")
    .is("admin_role_id", null) // Only non-staff users
    .order("email")

  if (searchQuery && searchQuery.trim()) {
    query = query.or(`email.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`)
  }

  const { data, error } = await query.limit(50)
  if (error) throw error
  return data
}

export async function promoteToStaff(userId: string, roleId: string) {
  await ensureAdmin()
  const supabase = await createClient()

  // Verify user exists and is not already staff
  const { data: user, error: userError } = await supabase
    .from("profiles")
    .select("id, admin_role_id")
    .eq("id", userId)
    .single()

  if (userError || !user) {
    throw new Error("User not found")
  }

  if (user.admin_role_id) {
    throw new Error("User is already a staff member")
  }

  // Assign the role AND set admin access
  const { error } = await supabase
    .from("profiles")
    .update({ admin_role_id: roleId, role: "admin" })
    .eq("id", userId)

  if (error) throw new Error(error.message)

  revalidatePath("/admin/team")
  redirect("/admin/team")
}