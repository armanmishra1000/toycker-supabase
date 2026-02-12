"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { Product, Order, CustomerProfile, Collection, Category, PaymentProvider, ShippingOption, OrderTimeline, ShippingPartner, OrderEventType, ProductVariant, VariantFormData, AdminRole, StaffMember, RewardTransactionWithOrder } from "@/lib/supabase/types"
import { revalidatePath, revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { requirePermission } from "@/lib/permissions/server"
import { PERMISSIONS } from "@/lib/permissions"

// --- Auth Check ---
export async function ensureAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?next=/admin")
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
    .select("first_name, last_name, email, role, admin_role_id, admin_role:admin_roles(name)")
    .eq("id", user.id)
    .single()

  let roleName = "Admin"
  if (profile?.admin_role) {
    if (Array.isArray(profile.admin_role)) {
      roleName = profile.admin_role[0]?.name || roleName
    } else {
      roleName = (profile.admin_role as any).name || roleName
    }
  } else if (profile?.role === "admin") {
    roleName = "System Admin"
  }

  return {
    email: profile?.email || user.email || "",
    firstName: profile?.first_name || "",
    lastName: profile?.last_name || "",
    role: roleName,
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

// --- Notifications ---
export async function getAdminNotifications() {
  await ensureAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("admin_notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20)

  if (error) throw error
  return data || []
}

export async function markNotificationAsRead(id: string) {
  await ensureAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from("admin_notifications")
    .update({ is_read: true })
    .eq("id", id)

  if (error) throw error
  revalidatePath("/admin")
}

export async function clearAllNotifications() {
  await ensureAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from("admin_notifications")
    .update({ is_read: true })
    .eq("is_read", false)

  if (error) throw error
  revalidatePath("/admin")
}

// --- Get Low Stock Stats ---
export async function getLowStockStats(threshold: number = 5) {
  await ensureAdmin()
  const supabase = await createClient()

  // Count products with low stock (base products)
  const { count: lowStockProducts } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .lte("stock_count", threshold)
    .gt("stock_count", 0)

  // Count products out of stock
  const { count: outOfStockProducts } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("stock_count", 0)

  // Count variants with low stock
  const { count: lowStockVariants } = await supabase
    .from("product_variants")
    .select("*", { count: "exact", head: true })
    .lte("inventory_quantity", threshold)
    .gt("inventory_quantity", 0)

  // Count variants out of stock
  const { count: outOfStockVariants } = await supabase
    .from("product_variants")
    .select("*", { count: "exact", head: true })
    .eq("inventory_quantity", 0)

  return {
    lowStock: (lowStockProducts || 0) + (lowStockVariants || 0),
    outOfStock: (outOfStockProducts || 0) + (outOfStockVariants || 0)
  }
}

// --- Global Search ---

export type AdminSearchResult = {
  id: string
  title: string
  subtitle?: string
  type: "product" | "order" | "customer" | "collection" | "category"
  url: string
  thumbnail?: string | null
}

export async function getAdminGlobalSearch(query: string): Promise<AdminSearchResult[]> {
  await ensureAdmin()
  const normalizedQuery = query.trim()
  if (!normalizedQuery || normalizedQuery.length < 2) return []

  const supabase = await createClient()

  const searchNum = !isNaN(Number(normalizedQuery)) ? Number(normalizedQuery) : null

  // Parallelize search queries
  const [productsRes, ordersRes, customersRes, collectionsRes, categoriesRes] = await Promise.all([
    // Search Products
    supabase
      .from("products")
      .select("id, name, handle, thumbnail")
      .or(`name.ilike.%${normalizedQuery}%,handle.ilike.%${normalizedQuery}%`)
      .limit(5),

    // Search Orders (Check if query is numeric for Order ID)
    searchNum !== null
      ? supabase
        .from("orders")
        .select("id, display_id, customer_email, status")
        .eq("display_id", searchNum)
        .limit(5)
      : supabase
        .from("orders")
        .select("id, display_id, customer_email, status")
        .ilike("customer_email", `%${normalizedQuery}%`)
        .limit(5),

    // Search Customers
    supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .or(`first_name.ilike.%${normalizedQuery}%,last_name.ilike.%${normalizedQuery}%,email.ilike.%${normalizedQuery}%`)
      .limit(5),

    // Search Collections
    supabase
      .from("collections")
      .select("id, title, handle")
      .or(`title.ilike.%${normalizedQuery}%,handle.ilike.%${normalizedQuery}%`)
      .limit(5),

    // Search Categories
    supabase
      .from("categories")
      .select("id, name, handle")
      .or(`name.ilike.%${normalizedQuery}%,handle.ilike.%${normalizedQuery}%`)
      .limit(5),
  ])

  const results: AdminSearchResult[] = []

  // Process Products
  if (productsRes.data) {
    productsRes.data.forEach((p) => {
      results.push({
        id: p.id,
        title: p.name,
        subtitle: `Product • ${p.handle}`,
        type: "product",
        url: `/admin/products/${p.id}`,
        thumbnail: p.thumbnail,
      })
    })
  }

  // Process Orders
  if (ordersRes.data) {
    ordersRes.data.forEach((o) => {
      results.push({
        id: o.id,
        title: `Order #${o.display_id}`,
        subtitle: `Order • ${o.customer_email} • ${o.status}`,
        type: "order",
        url: `/admin/orders/${o.id}`,
      })
    })
  }

  // Process Customers
  if (customersRes.data) {
    customersRes.data.forEach((c) => {
      results.push({
        id: c.id,
        title: `${c.first_name || ""} ${c.last_name || ""}`.trim() || "No Name",
        subtitle: `Customer • ${c.email}`,
        type: "customer",
        url: `/admin/customers/${c.id}`,
      })
    })
  }

  // Process Collections
  if (collectionsRes.data) {
    collectionsRes.data.forEach((c) => {
      results.push({
        id: c.id,
        title: c.title,
        subtitle: `Collection • ${c.handle}`,
        type: "collection",
        url: `/admin/collections/${c.id}`,
      })
    })
  }

  // Process Categories
  if (categoriesRes.data) {
    categoriesRes.data.forEach((c) => {
      results.push({
        id: c.id,
        title: c.name,
        subtitle: `Category • ${c.handle}`,
        type: "category",
        url: `/admin/categories/${c.id}`,
      })
    })
  }

  return results
}

// --- Categories ---

interface GetAdminCategoriesParams {
  page?: number
  limit?: number
  search?: string
}

interface PaginatedCategoriesResponse {
  categories: (Category & { products: { count: number }[] })[]
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

  // If limit is -1, we want all items, but we skip pagination logic
  const isFetchAll = limit === -1

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
    .select(`
      *,
      products:product_categories(count)
    `)
    .order("name")

  if (!isFetchAll) {
    query = query.range(from, to)
  }

  if (search && search.trim()) {
    query = query.or(`name.ilike.%${search}%,handle.ilike.%${search}%`)
  }

  const { data, error } = await query
  if (error) throw error

  return {
    categories: (data || []) as (Category & { products: { count: number }[] })[],
    count: count || 0,
    totalPages,
    currentPage: page
  }
}

export async function createCategory(formData: FormData) {
  await ensureAdmin()
  await requirePermission(PERMISSIONS.CATEGORIES_CREATE)
  const supabase = await createClient()

  const productIds = formData.getAll("product_ids") as string[]

  const category = {
    name: formData.get("name") as string,
    handle: formData.get("handle") as string,
    description: formData.get("description") as string,
    image_url: formData.get("image_url") as string | null,
  }

  const { data: newCategory, error } = await supabase
    .from("categories")
    .insert(category)
    .select("id")
    .single()

  if (error) throw new Error(error.message)

  // Handle product associations
  if (productIds.length > 0 && newCategory) {
    const productCategories = productIds.map(productId => ({
      product_id: productId,
      category_id: newCategory.id
    }))

    const { error: relError } = await supabase
      .from("product_categories")
      .insert(productCategories)

    if (relError) {
      console.error("Error linking products to category:", relError)
    }
  }

  revalidatePath("/admin/categories", "page")
  revalidatePath("/categories", "page")
  revalidateTag("categories", "max")
  redirect("/admin/categories")
}

export async function updateCategory(formData: FormData) {
  await ensureAdmin()
  await requirePermission(PERMISSIONS.CATEGORIES_UPDATE)
  const supabase = await createClient()
  const id = formData.get("id") as string
  const productIds = formData.getAll("product_ids") as string[]

  const updates = {
    name: formData.get("name") as string,
    handle: formData.get("handle") as string,
    description: formData.get("description") as string,
    image_url: formData.get("image_url") as string | null,
  }

  const { error } = await supabase.from("categories").update(updates).eq("id", id)
  if (error) throw new Error(error.message)

  // Update product associations: Delete-Insert pattern
  // 1. Delete existing associations
  await supabase.from("product_categories").delete().eq("category_id", id)

  // 2. Insert new associations
  if (productIds.length > 0) {
    const productCategories = productIds.map(productId => ({
      product_id: productId,
      category_id: id
    }))

    const { error: relError } = await supabase
      .from("product_categories")
      .insert(productCategories)

    if (relError) {
      console.error("Error updating category products:", relError)
    }
  }

  revalidatePath("/admin/categories", "page")
  revalidatePath(`/admin/categories/${id}`, "page")
  revalidatePath("/categories", "page")
  revalidateTag("categories", "max")
  redirect("/admin/categories")
}

export async function getAdminCategory(id: string): Promise<Category | null> {
  await ensureAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase.from("categories").select("*").eq("id", id).single()
  if (error) {
    console.error("Error fetching category:", error)
    return null
  }
  return data as Category
}

export async function getCategoryProducts(categoryId: string): Promise<string[]> {
  await ensureAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("product_categories")
    .select("product_id")
    .eq("category_id", categoryId)

  if (error) {
    console.error("Error fetching category products:", error)
    return []
  }

  return (data || []).map(cp => cp.product_id)
}

export async function deleteCategory(id: string) {
  await ensureAdmin()
  await requirePermission(PERMISSIONS.CATEGORIES_DELETE)
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
  stock_status?: "all" | "low_stock" | "out_of_stock"
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

  if (params.stock_status === "low_stock") {
    countQuery = countQuery.lte("stock_count", 5).gt("stock_count", 0)
  } else if (params.stock_status === "out_of_stock") {
    countQuery = countQuery.eq("stock_count", 0)
  }

  const { count } = await countQuery

  // Check if we want all items
  const isFetchAll = limit === -1

  // Calculate pagination only if not fetching all
  const offset = isFetchAll ? 0 : (page - 1) * limit
  const from = offset
  const to = isFetchAll ? -1 : offset + limit - 1
  const totalPages = count && !isFetchAll ? Math.ceil(count / limit) : 1

  // Fetch paginated data
  let query = supabase
    .from("products")
    .select("*, variants:product_variants(*)")
    .order("created_at", { ascending: false })

  // Only apply range if not fetching all
  if (!isFetchAll) {
    query = query.range(from, to)
  }

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  if (search && search.trim()) {
    query = query.or(`name.ilike.%${search}%,handle.ilike.%${search}%`)
  }

  if (params.stock_status === "low_stock") {
    query = query.lte("stock_count", 5).gt("stock_count", 0)
  } else if (params.stock_status === "out_of_stock") {
    query = query.eq("stock_count", 0)
  }

  const { data, error } = await query
  if (error) throw error

  const products = (data || []).map(product => {
    const variants = (product as any).variants || []
    if (variants.length > 0) {
      // If base price is 0, use min variant price
      if (product.price === 0) {
        product.price = Math.min(...variants.map((v: any) => v.price))
      }
      // If stock count is 0, use sum of variant stock
      if (product.stock_count === 0) {
        product.stock_count = variants.reduce((sum: number, v: any) => sum + (v.inventory_quantity || 0), 0)
      }
    }
    return product
  })

  return {
    products: products as Product[],
    count: count || 0,
    totalPages,
    currentPage: page
  }
}

export async function createProduct(formData: FormData) {
  await ensureAdmin()
  await requirePermission(PERMISSIONS.PRODUCTS_CREATE)
  const supabase = await createClient()

  const collectionIds = formData.getAll("collection_ids") as string[]
  // Keep first collection_id for backwards compatibility or primary collection
  const primaryCollectionId = collectionIds.length > 0 ? collectionIds[0] : null

  // Get category_ids (supporting multiple)
  const categoryId = formData.get("category_id") as string | null
  const categoryIds = formData.getAll("category_ids") as string[]

  // Backwards compatibility: if category_id is set but category_ids is empty, use it
  if (categoryId && categoryId.trim() !== "" && categoryIds.length === 0) {
    categoryIds.push(categoryId)
  }

  // Deprecated single category_id for DB column
  const primaryCategoryId = categoryIds.length > 0 ? categoryIds[0] : null

  // Get variants JSON if any
  const variantsJson = formData.get("variants") as string | null
  const variantsData: VariantFormData[] = variantsJson ? JSON.parse(variantsJson) : []

  let productPrice = formData.get("price") ? parseFloat(formData.get("price") as string) : 0
  const stockCountString = formData.get("stock_count") as string | null
  let productStockCount = (stockCountString && stockCountString.trim() !== "") ? parseInt(stockCountString) : 0

  // If we have multiple variants, override base product price/stock from them
  if (variantsData.length > 0) {
    productPrice = Math.min(...variantsData.map(v => v.price))
    productStockCount = variantsData.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0)
  }

  // Get compare_at_price
  const compareAtPrice = formData.get("compare_at_price") ? parseFloat(formData.get("compare_at_price") as string) : null

  const product = {
    name: formData.get("name") as string,
    handle: formData.get("handle") as string,
    description: formData.get("description") as string,
    price: productPrice,
    stock_count: productStockCount,
    image_url: formData.get("image_url") as string,
    collection_id: primaryCollectionId && primaryCollectionId.trim() !== "" ? primaryCollectionId : null, // Set primary collection
    category_id: primaryCategoryId, // Set category
    status: (formData.get("status") as string) || 'active',
    currency_code: "inr",
    metadata: {
      compare_at_price: compareAtPrice,
    },
    short_description: formData.get("short_description") as string,
    video_url: formData.get("video_url") as string,
    images: formData.get("images_json") ? JSON.parse(formData.get("images_json") as string) : [],
    seo_title: formData.get("seo_title") as string || null,
    seo_description: formData.get("seo_description") as string || null,
    seo_metadata: {
      keywords: formData.get("seo_keywords") as string || null,
      og_title: formData.get("og_title") as string || null,
      og_description: formData.get("og_description") as string || null,
      no_index: formData.get("no_index") === "true",
    }
  }

  const { data: newProduct, error } = await supabase
    .from("products")
    .insert(product)
    .select("id")
    .single()

  if (error) throw new Error(error.message)

  // Create variants
  if (newProduct) {
    if (variantsData.length > 0) {
      // Create provided variants
      const variantsToInsert = variantsData.map(v => ({
        product_id: newProduct.id,
        title: v.title,
        sku: v.sku,
        price: v.price,
        compare_at_price: v.compare_at_price,
        inventory_quantity: v.inventory_quantity,
        manage_inventory: true,
        allow_backorder: false,
      }))
      await supabase.from("product_variants").insert(variantsToInsert)
    }
  }

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

  // Insert multiple category associations
  if (categoryIds.length > 0 && newProduct) {
    const categoriesToInsert = categoryIds.map(cid => ({
      product_id: newProduct.id,
      category_id: cid
    }))

    await supabase.from("product_categories").insert(categoriesToInsert)
  }

  revalidatePath("/admin/products")
  redirect("/admin/products")
}

export async function updateProduct(formData: FormData) {
  await ensureAdmin()
  await requirePermission(PERMISSIONS.PRODUCTS_UPDATE)
  const supabase = await createClient()
  const id = formData.get("id") as string

  const collectionIds = formData.getAll("collection_ids") as string[]
  // Keep first collection_id for backwards compatibility
  const primaryCollectionId = collectionIds.length > 0 ? collectionIds[0] : null

  // Get category_ids (supporting multiple)
  const categoryId = formData.get("category_id") as string | null
  const categoryIds = formData.getAll("category_ids") as string[]

  // Get product_type
  const productType = formData.get("product_type") as string || "single"

  // Backwards compatibility: if category_id is set but category_ids is empty, use it
  if (categoryId && categoryId.trim() !== "" && categoryIds.length === 0) {
    categoryIds.push(categoryId)
  }

  // Deprecated single category_id for DB column
  const primaryCategoryId = categoryIds.length > 0 ? categoryIds[0] : null

  // Get current product to preserve existing metadata, price, stock and images
  const { data: currentProduct } = await supabase.from("products").select("handle, metadata, seo_metadata, price, stock_count, images, image_url").eq("id", id).single()

  const productPrice = formData.get("price") ? parseFloat(formData.get("price") as string) : currentProduct?.price || 0
  const stockCountString = formData.get("stock_count") as string | null
  const productStockCount = (stockCountString && stockCountString.trim() !== "") ? parseInt(stockCountString) : currentProduct?.stock_count || 0

  const newImageUrl = formData.get("image_url") as string
  const imageUrlChanged = newImageUrl !== currentProduct?.image_url

  const updates: any = {
    name: formData.get("name") as string,
    handle: formData.get("handle") as string,
    description: formData.get("description") as string,
    price: productPrice,
    stock_count: productStockCount,
    image_url: newImageUrl,
    collection_id: primaryCollectionId && primaryCollectionId.trim() !== "" ? primaryCollectionId : null, // Update primary collection
    category_id: primaryCategoryId, // Update category
    status: formData.get("status") as string,
    metadata: (() => {
      const meta = {
        ...(currentProduct?.metadata || {}),
        compare_at_price: formData.get("compare_at_price") ? parseFloat(formData.get("compare_at_price") as string) : (currentProduct?.metadata?.compare_at_price || null),
      }
      // Remove short_description from metadata to ensure the main column is the source of truth
      delete meta.short_description
      return meta
    })(),
    short_description: formData.get("short_description") as string,
    video_url: formData.get("video_url") as string,
    images: formData.get("images_json") ? JSON.parse(formData.get("images_json") as string) : (currentProduct?.images || []),
    seo_title: formData.get("seo_title") as string || null,
    seo_description: formData.get("seo_description") as string || null,
    seo_metadata: {
      ...(currentProduct?.seo_metadata || {}),
      keywords: formData.get("seo_keywords") as string || null,
      og_title: formData.get("og_title") as string || null,
      og_description: formData.get("og_description") as string || null,
      no_index: formData.get("no_index") === "true",
    }
  }

  // If image changed, clear the embedding so it gets regenerated
  if (imageUrlChanged && newImageUrl) {
    updates.image_embedding = null
  }

  const { error } = await supabase.from("products").update(updates).eq("id", id)
  if (error) throw new Error(error.message)

  // Handle variants based on product type
  if (productType === "single") {
    // If switching to single product, delete all variants
    await supabase.from("product_variants").delete().eq("product_id", id)
  }

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

  // Update categories:
  // 1. Delete existing associations
  await supabase.from("product_categories").delete().eq("product_id", id)

  // 2. Insert new associations
  if (categoryIds.length > 0) {
    const categoriesToInsert = categoryIds.map(cid => ({
      product_id: id,
      category_id: cid
    }))

    await supabase.from("product_categories").insert(categoriesToInsert)
  }

  // Regenerate image embedding if image URL changed
  if (imageUrlChanged && newImageUrl) {
    // Run in background - don't await
    regenerateImageEmbedding(id, newImageUrl).catch(err => {
      console.error(`Failed to regenerate embedding for product ${id}:`, err)
    })
  }

  // Handle product combinations (Frequently Bought Together)
  const relatedProductIds = formData.getAll("related_product_ids") as string[]
  if (relatedProductIds.length > 0) {
    await updateProductCombinations(id, relatedProductIds)
  } else {
    // If no related products provided, check if we should clear them
    // Only clear if the field was present in the form (implies a manual clear)
    if (formData.has("related_product_ids_present")) {
      await updateProductCombinations(id, [])
    }
  }

  revalidatePath("/admin/products")
  revalidatePath(`/admin/products/${id}`)
  revalidatePath(`/products/${updates.handle || currentProduct?.handle}`)
  redirect(`/admin/products/${id}`)
}

/**
 * Regenerate image embedding for a product
 * Runs in background to avoid slowing down product updates
 */
async function regenerateImageEmbedding(productId: string, imageUrl: string) {
  try {
    // Import dynamically to avoid loading CLIP model on every page load
    const { generateImageEmbedding } = await import("@/lib/ml/embeddings")
    const { createAdminClient } = await import("@/lib/supabase/admin")

    console.log(`Generating new embedding for product ${productId}...`)
    const embedding = await generateImageEmbedding(imageUrl)

    const supabase = await createAdminClient()
    const { error } = await supabase
      .from("products")
      .update({ image_embedding: embedding })
      .eq("id", productId)

    if (error) throw error
    console.log(`✓ Successfully updated embedding for product ${productId}`)
  } catch (error) {
    console.error(`✗ Failed to regenerate embedding for product ${productId}:`, error)
    throw error
  }
}

export async function deleteProduct(id: string, redirectTo?: string) {
  await ensureAdmin()
  await requirePermission(PERMISSIONS.PRODUCTS_DELETE)
  const supabase = await createClient()

  const { error } = await supabase.from("products").delete().eq("id", id)
  if (error) throw error

  revalidatePath("/admin/products")
  revalidatePath("/admin/inventory")

  if (redirectTo) {
    redirect(redirectTo)
  }
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

  // Separate new variants from existing ones
  const newVariants = variants.filter(v => !v.id)
  const existingVariants = variants.filter(v => v.id)

  // Insert new variants (without id - let DB auto-generate)
  if (newVariants.length > 0) {
    const { error: insertError } = await supabase
      .from("product_variants")
      .insert(newVariants.map(v => ({
        product_id: productId,
        title: v.title,
        sku: v.sku || null,
        price: v.price,
        compare_at_price: v.compare_at_price || null,
        inventory_quantity: v.inventory_quantity,
        image_url: v.image_url || null,
        manage_inventory: true,
        allow_backorder: false,
      })))

    if (insertError) throw new Error(insertError.message)
  }

  // Update existing variants
  if (existingVariants.length > 0) {
    const { error: updateError } = await supabase
      .from("product_variants")
      .upsert(existingVariants.map(v => ({
        id: v.id,
        product_id: productId,
        title: v.title,
        sku: v.sku || null,
        price: v.price,
        compare_at_price: v.compare_at_price || null,
        inventory_quantity: v.inventory_quantity,
        image_url: v.image_url || null,
        manage_inventory: true,
        allow_backorder: false,
      })), { onConflict: "id" })

    if (updateError) throw new Error(updateError.message)
  }

  // Update total stock count and price on product
  const { data: allVariants } = await supabase
    .from("product_variants")
    .select("inventory_quantity, price")
    .eq("product_id", productId)

  if (allVariants && allVariants.length > 0) {
    const totalStock = allVariants.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0)
    const minPrice = Math.min(...allVariants.map(v => v.price))
    await supabase.from("products").update({
      stock_count: totalStock,
      price: minPrice
    }).eq("id", productId)
  }

  // Get product handle for revalidation
  const { data: product } = await supabase.from("products").select("handle").eq("id", productId).single()

  revalidatePath(`/admin/products/${productId}`)
  revalidatePath("/admin/products")
  if (product?.handle) {
    revalidatePath(`/products/${product.handle}`)
  }
}
export async function deleteVariant(variantId: string) {
  await ensureAdmin()
  const supabase = await createClient()

  // Get variant details before deletion to find product_id
  const { data: variant } = await supabase
    .from("product_variants")
    .select("product_id")
    .eq("id", variantId)
    .single()

  const { error } = await supabase.from("product_variants").delete().eq("id", variantId)
  if (error) throw error

  if (variant) {
    // Get product handle for revalidation
    const { data: product } = await supabase.from("products").select("handle").eq("id", variant.product_id).single()

    revalidatePath(`/admin/products/${variant.product_id}`)
    if (product?.handle) {
      revalidatePath(`/products/${product.handle}`)
    }

    // Update total stock count on product
    const { data: allVariants } = await supabase
      .from("product_variants")
      .select("inventory_quantity")
      .eq("product_id", variant.product_id)

    const totalStock = allVariants?.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0) || 0
    await supabase.from("products").update({ stock_count: totalStock }).eq("id", variant.product_id)
  }
  revalidatePath("/admin/products")
  revalidatePath("/admin/inventory")
}

export async function updateInventory(productId: string, quantity: number, variantId?: string) {
  await ensureAdmin()
  await requirePermission(PERMISSIONS.INVENTORY_UPDATE)
  const supabase = await createClient()

  if (variantId) {
    // Update variant stock
    const { error: variantError } = await supabase
      .from("product_variants")
      .update({ inventory_quantity: quantity })
      .eq("id", variantId)

    if (variantError) throw variantError

    // Recalculate total stock
    const { data: allVariants } = await supabase
      .from("product_variants")
      .select("inventory_quantity")
      .eq("product_id", productId)

    if (allVariants) {
      const totalStock = allVariants.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0)
      await supabase.from("products").update({ stock_count: totalStock }).eq("id", productId)
    }
  } else {
    // Update base product stock
    const { error: productError } = await supabase
      .from("products")
      .update({ stock_count: quantity })
      .eq("id", productId)

    if (productError) throw productError

    // Also sync the default variant if it's a simple product
    const { data: variants } = await supabase
      .from("product_variants")
      .select("id")
      .eq("product_id", productId)

    if (variants && variants.length === 1) {
      await supabase
        .from("product_variants")
        .update({ inventory_quantity: quantity })
        .eq("id", variants[0].id)
    }
  }

  revalidatePath("/admin/inventory")
  revalidatePath(`/admin/products/${productId}`)

  // Get handle for storefront revalidation
  const { data: product } = await supabase.from("products").select("handle").eq("id", productId).single()
  if (product?.handle) {
    revalidatePath(`/products/${product.handle}`)
  }
}

// --- Product Options ---

export async function getProductOptions(productId: string) {
  await ensureAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("product_options")
    .select(`
      *,
      values:product_option_values(*)
    `)
    .eq("product_id", productId)
    .order("created_at")

  if (error) throw error
  return data
}

export async function saveProductOption(
  productId: string,
  option: { title: string; values: string[] }
) {
  await ensureAdmin()
  const supabase = await createClient()

  // Insert option
  const { data: optionData, error: optionError } = await supabase
    .from("product_options")
    .insert({ product_id: productId, title: option.title })
    .select()
    .single()

  if (optionError) throw optionError

  // Insert values
  const { error: valuesError } = await supabase
    .from("product_option_values")
    .insert(
      option.values.map(value => ({
        option_id: optionData.id,
        value: value.trim()
      }))
    )

  if (valuesError) throw valuesError

  revalidatePath(`/admin/products/${productId}`)
  return optionData
}

export async function deleteProductOption(optionId: string) {
  await ensureAdmin()
  const supabase = await createClient()

  await supabase.from("product_options").delete().eq("id", optionId)
}

export async function generateVariantsFromOptions(
  productId: string,
  options: { title: string; values: { value: string }[] }[]
) {
  await ensureAdmin()
  const supabase = await createClient()

  // Generate Cartesian product of all option values
  const generateVariantCombinations = (
    options: { title: string; values: { value: string }[] }[]
  ): string[][] => {
    if (options.length === 0) return [[]]

    const [firstOption, ...remainingOptions] = options
    const remainingCombinations = generateVariantCombinations(remainingOptions)

    const firstOptionValues = firstOption.values || []

    const combinations: string[][] = []
    for (const valueObj of firstOptionValues) {
      for (const combination of remainingCombinations) {
        combinations.push([valueObj.value, ...combination])
      }
    }

    return combinations
  }

  const combinations = generateVariantCombinations(options)

  // Create variants for each combination
  const variantsToInsert = combinations.map(combination => ({
    product_id: productId,
    title: combination.join(" / "),
    price: 0,
    inventory_quantity: 0,
    manage_inventory: true,
    allow_backorder: false,
  }))

  const { data, error } = await supabase
    .from("product_variants")
    .insert(variantsToInsert)
    .select()

  if (error) throw error

  revalidatePath(`/admin/products/${productId}`)
  return data
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

  // If limit is -1, we want all items
  const isFetchAll = limit === -1

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
    .select(`
    *,
    products:product_collections(count)
    `)
    .order("created_at", { ascending: false })

  if (!isFetchAll) {
    query = query.range(from, to)
  }

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

export async function getProductCategories(productId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("product_categories")
    .select("category_id")
    .eq("product_id", productId)

  if (error) return []
  return data.map(item => item.category_id)
}

export async function getProductCombinations(productId: string): Promise<string[]> {
  await ensureAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("product_combinations")
    .select("related_product_id")
    .eq("product_id", productId)

  if (error) {
    console.error("Error fetching product combinations:", error)
    return []
  }

  return data.map(item => item.related_product_id)
}

export async function updateProductCombinations(productId: string, relatedProductIds: string[]) {
  await ensureAdmin()
  const supabase = await createClient()

  // 1. Delete existing combinations
  const { error: deleteError } = await supabase
    .from("product_combinations")
    .delete()
    .eq("product_id", productId)

  if (deleteError) {
    console.error("Error deleting product combinations:", deleteError)
    throw deleteError
  }

  // 2. Insert new combinations
  if (relatedProductIds.length > 0) {
    const combinationsToInsert = relatedProductIds.map(relatedId => ({
      product_id: productId,
      related_product_id: relatedId
    }))

    const { error: insertError } = await supabase
      .from("product_combinations")
      .insert(combinationsToInsert)

    if (insertError) {
      console.error("Error inserting product combinations:", insertError)
      throw insertError
    }
  }

  revalidatePath(`/admin/products/${productId}`)
  revalidatePath("/products") // Revalidate storefront products
}

export async function createCollection(formData: FormData) {
  await ensureAdmin()
  await requirePermission(PERMISSIONS.COLLECTIONS_CREATE)
  const supabase = await createClient()

  const collection = {
    title: formData.get("title") as string,
    handle: formData.get("handle") as string,
    image_url: formData.get("image_url") as string | null,
  }

  // Insert collection and get ID
  const { data: newCollection, error } = await supabase
    .from("collections")
    .insert(collection)
    .select("id")
    .single()

  if (error) throw new Error(error.message)

  // Handle product associations
  const productIds = formData.getAll("product_ids") as string[]
  if (productIds.length > 0 && newCollection) {
    const productCollections = productIds.map(productId => ({
      product_id: productId,
      collection_id: newCollection.id
    }))

    const { error: junctionError } = await supabase
      .from("product_collections")
      .insert(productCollections)

    if (junctionError) {
      console.error("Error linking products:", junctionError)
      // Non-blocking: collection created successfully, associations failed
    }
  }

  revalidatePath("/admin/collections", "page")
  revalidatePath("/collections", "page")
  revalidateTag("collections", "max")
  redirect("/admin/collections")
}

export async function updateCollection(formData: FormData) {
  await ensureAdmin()
  await requirePermission(PERMISSIONS.COLLECTIONS_UPDATE)
  const supabase = await createClient()
  const id = formData.get("id") as string

  const updates = {
    title: formData.get("title") as string,
    handle: formData.get("handle") as string,
    image_url: formData.get("image_url") as string | null,
  }

  const { error } = await supabase
    .from("collections")
    .update(updates)
    .eq("id", id)

  if (error) throw new Error(error.message)

  // Update product associations using delete-insert pattern
  const productIds = formData.getAll("product_ids") as string[]

  // 1. Delete existing associations
  await supabase.from("product_collections").delete().eq("collection_id", id)

  // 2. Insert new associations
  if (productIds.length > 0) {
    const productCollections = productIds.map(productId => ({
      product_id: productId,
      collection_id: id
    }))

    const { error: junctionError } = await supabase
      .from("product_collections")
      .insert(productCollections)

    if (junctionError) {
      console.error("Error updating product associations:", junctionError)
    }
  }

  revalidatePath("/admin/collections", "page")
  revalidatePath(`/admin/collections/${id}`, "page")
  revalidatePath("/collections", "page")
  revalidateTag("collections", "max")
  redirect("/admin/collections")
}

export async function deleteCollection(id: string) {
  await ensureAdmin()
  await requirePermission(PERMISSIONS.COLLECTIONS_DELETE)
  const supabase = await createClient()
  await supabase.from("collections").delete().eq("id", id)
  revalidatePath("/admin/collections", "page")
  revalidatePath("/collections", "page")
  revalidateTag("collections", "max")
}

export async function getCollectionProducts(collectionId: string): Promise<string[]> {
  await ensureAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("product_collections")
    .select("product_id")
    .eq("collection_id", collectionId)

  if (error) {
    console.error("Error fetching collection products:", error)
    return []
  }

  return data.map(item => item.product_id)
}


export async function getProductCollections(productId: string) {
  await ensureAdmin()
  const supabase = await createClient()

  // Try fetching with plural relationship 'collections'
  const { data, error } = await supabase
    .from("product_collections")
    .select("collection_id, collections:collections(*)")
    .eq("product_id", productId)

  if (error || !data || data.length === 0) {
    // Try singular relationship 'collection' if plural fails or is empty
    const { data: singularData, error: singularError } = await supabase
      .from("product_collections")
      .select("collection_id, collection:collections(*)")
      .eq("product_id", productId)

    if (singularError || !singularData) {
      console.error("Error fetching product collections:", singularError || "No data")
      return []
    }

    return singularData
      .map(item => (item as any).collection as unknown as Collection)
      .filter(Boolean)
  }

  return data
    .map(item => (item as any).collections as unknown as Collection)
    .filter(Boolean)
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

  const updates: any = { status }
  if (status === 'order_placed') {
    updates.payment_status = 'captured'
  }

  const { error } = await supabase.from("orders").update(updates).eq("id", id)
  if (error) throw error

  // Log to timeline
  await logOrderEvent(
    id,
    status as OrderEventType,
    `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    `Order status changed to ${status}.`,
    "admin"
  )

  revalidatePath(`/admin/orders/${id}`)
  revalidatePath("/admin/orders")
}

// --- Customers ---

interface GetAdminCustomersParams {
  page?: number
  limit?: number
  search?: string
  type?: "admin" | "club" | "customer" | "all"
}

interface PaginatedCustomersResponse {
  customers: CustomerProfile[]
  count: number
  totalPages: number
  currentPage: number
}

export async function getAdminCustomers(params: GetAdminCustomersParams = {}): Promise<PaginatedCustomersResponse> {
  await ensureAdmin()

  const { page = 1, limit = 20, search, type } = params
  const supabase = await createClient()

  // Calculate total count first
  let countQuery = supabase.from("profiles").select("*", { count: "exact", head: true })

  if (type === "admin") {
    countQuery = countQuery.eq("role", "admin")
  } else if (type === "club") {
    countQuery = countQuery.eq("is_club_member", true).neq("role", "admin")
  } else if (type === "customer") {
    countQuery = countQuery.eq("is_club_member", false).or("role.is.null,role.neq.admin")
  }

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

  if (type === "admin") {
    query = query.eq("role", "admin")
  } else if (type === "club") {
    query = query.eq("is_club_member", true).neq("role", "admin")
  } else if (type === "customer") {
    query = query.eq("is_club_member", false).or("role.is.null,role.neq.admin")
  }

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
  // Use admin client to bypass user-specific RLS policies
  const supabase = await createAdminClient()

  const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", id).single()
  if (profileError) throw profileError

  // Fetch only first 5 orders and transactions for initial load
  const { data: orders, count: orderCount } = await supabase
    .from("orders")
    .select("*", { count: "exact" })
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .range(0, 4)

  const { data: addresses } = await supabase.from("addresses").select("*").eq("user_id", id)
  const { data: wallet } = await supabase.from("reward_wallets").select("*").eq("user_id", id).maybeSingle()

  // Fetch initial transactions
  const initialTransactions = wallet ? await getPaginatedCustomerRewardTransactions(id, 1, 5) : { data: [], total: 0 }

  // Total spent calculation
  const { data: orderTotals } = await supabase
    .from("orders")
    .select("total_amount")
    .eq("user_id", id)
    .not("status", "in", '("cancelled","failed")')

  const totalSpent = (orderTotals || []).reduce(
    (sum, row) => sum + Number(row.total_amount || 0), 0
  )

  return {
    ...profile,
    orders: orders || [],
    order_count: orderCount || 0,
    addresses: addresses || [],
    reward_wallet: wallet || null,
    reward_transactions: initialTransactions.data,
    reward_transaction_total: initialTransactions.total,
    total_spent: totalSpent,
    // Use fallback values if profile columns are null (though migration should handle this)
    is_club_member: profile.is_club_member || false,
    club_member_since: profile.club_member_since || null,
    total_club_savings: profile.total_club_savings || 0
  }
}

export async function getPaginatedCustomerOrders(userId: string, page: number = 1, limit: number = 5) {
  await ensureAdmin()
  const supabase = await createAdminClient()

  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, count, error } = await supabase
    .from("orders")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) throw error

  return {
    data: data || [],
    total: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
    currentPage: page
  }
}

export async function getPaginatedCustomerRewardTransactions(userId: string, page: number = 1, limit: number = 5) {
  await ensureAdmin()
  const supabase = await createAdminClient()

  const { data: wallet } = await supabase
    .from("reward_wallets")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle()

  if (!wallet) return { data: [], total: 0, totalPages: 0, currentPage: page }

  const from = (page - 1) * limit
  const to = from + limit - 1

  // 1. Fetch paginated transactions
  const { data: transactions, count, error: txError } = await supabase
    .from("reward_transactions")
    .select("*", { count: "exact" })
    .eq("wallet_id", wallet.id)
    .order("created_at", { ascending: false })
    .range(from, to)

  if (txError || !transactions) throw txError || new Error("Failed to fetch transactions")

  // 2. Fetch order display IDs for these transactions
  const orderIds = Array.from(new Set(
    transactions
      .filter((tx: any) => tx.order_id)
      .map((tx: any) => tx.order_id)
  ))

  let ordersMap: Record<string, any> = {}
  if (orderIds.length > 0) {
    const { data: orders } = await supabase
      .from("orders")
      .select("id, display_id")
      .in("id", orderIds)

    orders?.forEach(o => {
      ordersMap[o.id] = o
    })
  }

  const data = transactions.map(tx => ({
    ...tx,
    orders: ordersMap[tx.order_id] || null
  }))

  return {
    data,
    total: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
    currentPage: page
  }
}

export async function getAdminRewardTransactions(userId: string, supabase?: any): Promise<RewardTransactionWithOrder[]> {
  if (!supabase) {
    await ensureAdmin()
    supabase = await createAdminClient()
  }

  const { data: wallet } = await supabase
    .from("reward_wallets")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle()

  if (!wallet) return []

  // 1. Fetch transactions
  const { data: transactions, error: txError } = await supabase
    .from("reward_transactions")
    .select("*")
    .eq("wallet_id", wallet.id)
    .order("created_at", { ascending: false })

  if (txError || !transactions) return []

  // 2. Collect unique order IDs
  const orderIds = Array.from(new Set(
    transactions
      .filter((tx: any) => tx.order_id)
      .map((tx: any) => tx.order_id)
  ))

  // 3. Fetch order display IDs
  let ordersMap: Record<string, number> = {}
  if (orderIds.length > 0) {
    const { data: orders } = await supabase
      .from("orders")
      .select("id, display_id")
      .in("id", orderIds)

    if (orders) {
      ordersMap = orders.reduce((acc: Record<string, number>, order: any) => {
        acc[order.id] = order.display_id
        return acc
      }, {} as Record<string, number>)
    }
  }

  // 4. Map display IDs back to transactions
  return transactions.map((tx: any) => ({
    ...tx,
    orders: tx.order_id && ordersMap[tx.order_id]
      ? { display_id: ordersMap[tx.order_id] }
      : null
  })) as RewardTransactionWithOrder[]
}

export async function deleteCustomer(id: string) {
  try {
    await ensureAdmin()
    await requirePermission(PERMISSIONS.CUSTOMERS_DELETE)
    const supabase = await createAdminClient()

    const { error } = await supabase.auth.admin.deleteUser(id)

    if (error) {
      console.error("ADMIN: deleteUser auth api error:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/customers")
    return { success: true }
  } catch (err: any) {
    console.error("ADMIN: deleteCustomer CRITICAL FAILURE:", err)
    // Return a user-friendly error if the key is missing
    if (err.message?.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return { success: false, error: "Server Error: SUPABASE_SERVICE_ROLE_KEY is not configured." }
    }
    return { success: false, error: err.message || "An unexpected error occurred." }
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

  if (error) {
    console.error("Error fetching payment methods:", error)
    throw new Error(error.message || "Failed to fetch payment methods")
  }
  return data as PaymentProvider[]
}

export async function createPaymentMethod(formData: FormData) {
  await ensureAdmin()
  await requirePermission(PERMISSIONS.PAYMENTS_CREATE)
  const supabase = await createClient()
  const method = {
    id: formData.get("id") as string,
    name: formData.get("name") as string,
    description: formData.get("description") as string || null,
    discount_percentage: Number(formData.get("discount_percentage") || 0),
    is_active: formData.get("is_active") === "true",
  }

  const { error } = await supabase.from("payment_providers").insert(method)
  if (error) {
    console.error("Error creating payment method:", error)
    throw new Error(error.message || "Failed to create payment method")
  }

  revalidatePath("/admin/payments")
  redirect("/admin/payments")
}

export async function updatePaymentMethod(id: string, formData: FormData) {
  await ensureAdmin()
  await requirePermission(PERMISSIONS.PAYMENTS_UPDATE)
  const supabase = await createClient()
  const method = {
    name: formData.get("name") as string,
    description: formData.get("description") as string || null,
    discount_percentage: parseFloat(formData.get("discount_percentage") as string) || 0,
    is_active: formData.get("is_active") === "true",
  }

  const { error } = await supabase
    .from("payment_providers")
    .update(method)
    .eq("id", id)

  if (error) throw new Error(error.message)

  revalidatePath("/admin/payments")
  revalidatePath(`/admin/payments/${id}`)
  redirect("/admin/payments")
}

export async function getAdminPaymentMethod(id: string) {
  await ensureAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("payment_providers")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    console.error(`Error fetching payment provider ${id}:`, error)
    throw new Error(error.message || "Failed to fetch payment method")
  }
  return data as PaymentProvider | null
}

export async function deletePaymentMethod(id: string) {
  await ensureAdmin()
  await requirePermission(PERMISSIONS.PAYMENTS_DELETE)
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
  await requirePermission(PERMISSIONS.SHIPPING_CREATE)
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

export async function getShippingOption(id: string) {
  await ensureAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("shipping_options")
    .select("*")
    .eq("id", id)
    .single()

  if (error) throw error
  return data as ShippingOption
}

export async function updateShippingOption(id: string, formData: FormData) {
  await ensureAdmin()
  await requirePermission(PERMISSIONS.SHIPPING_UPDATE)
  const supabase = await createClient()
  const option = {
    name: formData.get("name") as string,
    amount: parseFloat(formData.get("amount") as string),
    min_order_free_shipping: formData.get("min_order_free_shipping")
      ? parseFloat(formData.get("min_order_free_shipping") as string)
      : null,
    is_active: formData.get("is_active") === "true",
  }

  const { error } = await supabase
    .from("shipping_options")
    .update(option)
    .eq("id", id)

  if (error) throw new Error(error.message)

  revalidatePath("/admin/shipping")
  redirect("/admin/shipping")
}

export async function deleteShippingOption(id: string) {
  await ensureAdmin()
  await requirePermission(PERMISSIONS.SHIPPING_DELETE)
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
  await requirePermission(PERMISSIONS.SHIPPING_PARTNERS_CREATE)
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
  await requirePermission(PERMISSIONS.SHIPPING_PARTNERS_DELETE)
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

async function getAdminActorDisplay(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return "Admin"

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, email")
    .eq("id", user.id)
    .maybeSingle()

  const name = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim()
  return name || profile?.email || user.email || "Admin"
}

export async function logOrderEvent(
  orderId: string,
  eventType: OrderEventType,
  title: string,
  description: string,
  actor: string = "system",
  metadata: Record<string, unknown> = {},
  actorDisplayOverride?: string
) {
  const supabase = await createAdminClient()

  let actorDisplay = actorDisplayOverride || actor
  if (actor === "admin" && !actorDisplayOverride) {
    actorDisplay = await getAdminActorDisplay()
  }

  const { error } = await supabase.from("order_timeline").insert({
    order_id: orderId,
    event_type: eventType,
    title,
    description,
    actor: actorDisplay,
    metadata,
  })

  if (error) {
    console.error("Error logging order event:", error)
  }
}

// --- Order Actions ---
export async function acceptOrder(orderId: string) {
  await ensureAdmin()
  await requirePermission(PERMISSIONS.ORDERS_UPDATE)
  const supabase = await createClient()
  const actorDisplay = await getAdminActorDisplay()

  const { error } = await supabase
    .from("orders")
    .update({
      status: "accepted",
      updated_at: new Date().toISOString()
    })
    .eq("id", orderId)

  if (error) throw error

  await logOrderEvent(
    orderId,
    "processing",
    "Order Accepted",
    "Admin has accepted the order and it is now being prepared for shipping.",
    "admin",
    {},
    actorDisplay
  )

  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath("/admin/orders")
}

/**
 * Credit reward points to a club member when their order is delivered.
 * Uses admin client to bypass RLS. Idempotent via metadata flag.
 */
async function creditRewardsOnDelivery(order: {
  id: string
  user_id: string | null
  subtotal: number | null
  total: number | null
  metadata: Record<string, unknown> | null
}) {
  if (!order.user_id) return  // Skip guest orders

  const metadata = (order.metadata || {}) as Record<string, unknown>
  if (metadata.rewards_credited === true) {
    console.log(`[REWARDS] Order ${order.id} already credited, skipping.`)
    return
  }

  // Check club membership via profiles (no auth cookies needed)
  const adminSupabase = await createAdminClient()
  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("is_club_member")
    .eq("id", order.user_id)
    .maybeSingle()

  if (!profile?.is_club_member) {
    // Try to activate membership if order qualifies (safety net for orders placed before fix)
    const { checkAndActivateMembership } = await import("@lib/data/club")
    const orderTotal = Number(order.total || 0)
    const activated = await checkAndActivateMembership(order.user_id, orderTotal)
    if (!activated) return  // Not eligible, skip rewards
  }

  const { getClubSettings } = await import("@lib/data/club")
  const settings = await getClubSettings()
  if (!settings.is_active || settings.rewards_percentage <= 0) return

  const orderSubtotal = Number(order.subtotal || order.total || 0)
  const pointsEarned = Math.floor((orderSubtotal * settings.rewards_percentage) / 100)
  if (pointsEarned <= 0) return

  // Use creditRewards from rewards.ts (now uses admin client internally)
  const { creditRewards } = await import("@lib/data/rewards")
  const credited = await creditRewards(order.user_id, order.id, orderSubtotal, settings.rewards_percentage)

  // Set idempotency flag in order metadata
  await adminSupabase.from("orders").update({
    metadata: { ...metadata, rewards_earned: credited, rewards_credited: true }
  }).eq("id", order.id)

  if (credited > 0) {
    console.log(`[REWARDS] Credited ${credited} points to user ${order.user_id} for order ${order.id}`)
  }
}

export async function markOrderAsDelivered(orderId: string) {
  await ensureAdmin()
  const supabase = await createClient()
  const actorDisplay = await getAdminActorDisplay()

  const { data: order } = await supabase
    .from("orders")
    .select("id, user_id, subtotal, total, payment_method, payment_status, metadata")
    .eq("id", orderId)
    .maybeSingle()

  if (!order) throw new Error("Order not found")

  const normalizedMethod = (order.payment_method || "").toLowerCase()
  const isCod = normalizedMethod.includes("cod") || normalizedMethod.includes("cash") || normalizedMethod.includes("pp_system_default") || normalizedMethod === "manual"

  const { error } = await supabase
    .from("orders")
    .update({
      status: "delivered",
      fulfillment_status: "delivered",
      payment_status: isCod ? "captured" : order.payment_status,
      updated_at: new Date().toISOString()
    })
    .eq("id", orderId)

  if (error) throw error

  // Credit reward points to club members (idempotent)
  await creditRewardsOnDelivery(order)

  await logOrderEvent(
    orderId,
    "delivered",
    "Order Delivered",
    isCod
      ? "Order delivered. COD marked as collected."
      : "Order has been successfully delivered to the customer.",
    "admin",
    {},
    actorDisplay
  )

  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath("/admin/orders")
  revalidateTag("rewards", "max")
}

export async function cancelOrder(orderId: string) {
  await ensureAdmin()
  await requirePermission(PERMISSIONS.ORDERS_UPDATE)
  const supabase = await createClient()
  const actorDisplay = await getAdminActorDisplay()

  const { data: order } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .maybeSingle()

  if (!order) throw new Error("Order not found")
  if (order.status === "cancelled" || order.status === "failed") return { success: true, alreadyCancelled: true }
  if (order.status === "delivered" || order.status === "shipped") throw new Error("Cannot cancel an order that has already shipped or delivered.")

  const { error } = await supabase
    .from("orders")
    .update({
      status: "cancelled",
      fulfillment_status: "cancelled",
      payment_status: "cancelled",
      updated_at: new Date().toISOString()
    })
    .eq("id", orderId)

  if (error) throw error

  await logOrderEvent(
    orderId,
    "cancelled",
    "Order Cancelled",
    "Order was cancelled by admin.",
    "admin",
    {},
    actorDisplay
  )

  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath("/admin/orders")

  return { success: true }
}

export async function markOrderAsPaid(orderId: string) {
  await ensureAdmin()
  const supabase = await createClient()
  const actorDisplay = await getAdminActorDisplay()

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, status, payment_status, payment_method, metadata")
    .eq("id", orderId)
    .single()

  if (fetchError || !order) {
    throw new Error(fetchError?.message || "Order not found")
  }

  if (order.status === "cancelled" || order.status === "failed") {
    throw new Error("Cannot mark payment for cancelled or failed orders.")
  }

  if (order.status !== "delivered") {
    throw new Error("Payment can only be marked after the order is delivered.")
  }

  const paymentMethodRaw = (order.payment_method || (order.metadata as any)?.payment_method || "").toString().toLowerCase()
  const isCod = paymentMethodRaw.includes("cod") || paymentMethodRaw.includes("cash on delivery") || paymentMethodRaw.includes("cash")

  const alreadyPaid = order.payment_status === "paid" || order.payment_status === "captured"
  if (alreadyPaid) {
    return { success: true, alreadyPaid: true }
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      updated_at: new Date().toISOString()
    })
    .eq("id", orderId)

  if (updateError) throw new Error(updateError.message)

  await logOrderEvent(
    orderId,
    "payment_captured",
    isCod ? "COD Payment Collected" : "Payment Marked as Paid",
    isCod
      ? "Cash on Delivery payment collected and marked as paid."
      : "Payment marked as paid by admin.",
    "admin",
    { payment_method: order.payment_method || (order.metadata as any)?.payment_method || "unknown" },
    actorDisplay
  )

  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath("/admin/orders")

  return { success: true }
}

// --- Order Fulfillment ---
export async function fulfillOrder(orderId: string, formData: FormData) {
  await ensureAdmin()
  const supabase = await createClient()
  const actorDisplay = await getAdminActorDisplay()

  const shippingPartnerId = formData.get("shipping_partner_id") as string
  const trackingNumber = formData.get("tracking_number") as string

  if (!trackingNumber || trackingNumber.trim() === "") {
    throw new Error("Tracking number is required")
  }

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
      status: "shipped",
      fulfillment_status: "shipped",
      shipping_partner_id: shippingPartnerId,
      tracking_number: trackingNumber || null,
      updated_at: new Date().toISOString()
    })
    .eq("id", orderId)

  if (error) throw new Error(error.message)

  // Log timeline event
  const description = trackingNumber
    ? `Order shipped via ${partnerName}.Tracking: ${trackingNumber} `
    : `Order shipped via ${partnerName}.`

  await logOrderEvent(
    orderId,
    "shipped",
    "Order Shipped",
    description,
    "admin",
    { shipping_partner: partnerName, tracking_number: trackingNumber },
    actorDisplay
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
  const supabase = await createAdminClient()

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
  const supabase = await createAdminClient()

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

export async function getAdminRole(id: string) {
  await ensureAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("admin_roles")
    .select("*")
    .eq("id", id)
    .single()

  if (error) throw error
  return data as AdminRole
}

export async function updateRole(id: string, formData: FormData) {
  await ensureAdmin()
  const supabase = await createAdminClient()

  // Check if role is system role
  const { data: role } = await supabase
    .from("admin_roles")
    .select("is_system")
    .eq("id", id)
    .single()

  if (role?.is_system) {
    throw new Error("Cannot edit system roles")
  }

  const name = formData.get("name") as string
  const permissionsStr = formData.get("permissions") as string
  const permissions = permissionsStr ? JSON.parse(permissionsStr) as string[] : []

  const { error } = await supabase
    .from("admin_roles")
    .update({
      name,
      permissions,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) throw new Error(error.message)
  revalidatePath("/admin/team/roles")
  redirect("/admin/team/roles")
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
    countQuery = countQuery.or(`first_name.ilike.% ${search}%, last_name.ilike.% ${search}%, email.ilike.% ${search}% `)
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
    admin_role: admin_roles(*)
    `)
    .not("admin_role_id", "is", null)
    .order("created_at", { ascending: false })
    .range(from, to)

  if (search && search.trim()) {
    query = query.or(`first_name.ilike.% ${search}%, last_name.ilike.% ${search}%, email.ilike.% ${search}% `)
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