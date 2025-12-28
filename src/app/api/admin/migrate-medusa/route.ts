/**
 * API Route: POST /api/admin/migrate-medusa
 * Complete data migration from Medusa to Supabase
 * Migrates: Collections, Categories, Products, Variants, Images, Prices
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import {
    createMedusaClient,
    getVariantPrice,
    getProductImages,
    MedusaCategory,
} from "@/lib/medusa/medusa-client"

// Medusa admin credentials (should match the logged-in admin)
const MEDUSA_CONFIG = {
    baseUrl: "http://localhost:9000",
    email: "admin@medusa-test.com", // Default Medusa admin
    password: "supersecret",
}

// Helper function to flatten nested categories and deduplicate by handle
const flattenCategories = (cats: MedusaCategory[]): MedusaCategory[] => {
    const seen = new Map<string, MedusaCategory>()

    const flatten = (categories: MedusaCategory[]) => {
        for (const cat of categories) {
            if (!seen.has(cat.handle)) {
                seen.set(cat.handle, cat)
            }
            if (cat.category_children && cat.category_children.length > 0) {
                flatten(cat.category_children)
            }
        }
    }

    flatten(cats)
    return Array.from(seen.values())
}

export async function POST(request: NextRequest) {
    try {
        // Check admin auth
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Check if user is admin
        const ADMIN_EMAILS = ["admin@toycker.com", "tutanymo@fxzig.com"]
        const isHardcodedAdmin = ADMIN_EMAILS.includes(user.email || "")

        if (!isHardcodedAdmin) {
            const { data: profile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single()

            if (profile?.role !== "admin") {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 })
            }
        }

        // Get optional Medusa credentials from request body
        const body = await request.json().catch(() => ({}))
        const medusaConfig = {
            baseUrl: body.medusaUrl || MEDUSA_CONFIG.baseUrl,
            email: body.email || MEDUSA_CONFIG.email,
            password: body.password || MEDUSA_CONFIG.password,
        }

        console.log("[Migration] Starting Medusa to Supabase migration...")
        console.log("[Migration] Connecting to Medusa at:", medusaConfig.baseUrl)

        // Create Medusa client
        const medusa = await createMedusaClient(medusaConfig)

        // Stats to track progress
        const stats = {
            collections: 0,
            categories: 0,
            products: 0,
            variants: 0,
        }

        // ====== STEP 1: Clear existing data (in reverse dependency order) ======
        console.log("[Migration] Clearing existing data...")

        // Clear cart_items first
        await supabase.from("cart_items").delete().neq("id", "00000000-0000-0000-0000-000000000000")

        // Clear order_items
        await supabase.from("order_items").delete().neq("id", "00000000-0000-0000-0000-000000000000")

        // Clear product_variants
        await supabase.from("product_variants").delete().neq("id", "00000000-0000-0000-0000-000000000000")

        // Clear products
        await supabase.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000")

        // Clear categories
        await supabase.from("categories").delete().neq("id", "00000000-0000-0000-0000-000000000000")

        // Clear collections
        await supabase.from("collections").delete().neq("id", "00000000-0000-0000-0000-000000000000")

        console.log("[Migration] Existing data cleared")

        // ====== STEP 2: Fetch and insert Collections ======
        console.log("[Migration] Fetching collections from Medusa...")
        const medusaCollections = await medusa.fetchCollections()
        console.log(`[Migration] Found ${medusaCollections.length} collections`)

        // Map Medusa collection ID to Supabase collection ID
        const collectionIdMap = new Map<string, string>()

        for (const col of medusaCollections) {
            const { data, error } = await supabase
                .from("collections")
                .insert({
                    title: col.title,
                    handle: col.handle,
                })
                .select("id")
                .single()

            if (!error && data) {
                collectionIdMap.set(col.id, data.id)
                stats.collections++
            } else {
                console.error(`[Migration] Error inserting collection ${col.handle}:`, error)
            }
        }

        // ====== STEP 3: Fetch and insert Categories ======
        console.log("[Migration] Fetching categories from Medusa...")
        const medusaCategories = await medusa.fetchCategories()
        console.log(`[Migration] Found ${medusaCategories.length} categories`)

        // Map Medusa category ID to Supabase category ID
        const categoryIdMap = new Map<string, string>()

        // Flatten categories using module-level helper
        const flatCategories = flattenCategories(medusaCategories)

        for (const cat of flatCategories) {
            const { data, error } = await supabase
                .from("categories")
                .insert({
                    name: cat.name,
                    handle: cat.handle,
                    description: cat.description || null,
                    // parent_category_id is handled separately if needed
                })
                .select("id")
                .single()

            if (!error && data) {
                categoryIdMap.set(cat.id, data.id)
                stats.categories++
            } else {
                console.error(`[Migration] Error inserting category ${cat.handle}:`, error)
            }
        }

        // ====== STEP 4: Fetch and insert Products with Variants ======
        console.log("[Migration] Fetching products from Medusa...")
        const medusaProducts = await medusa.fetchProducts()
        console.log(`[Migration] Found ${medusaProducts.length} products`)

        for (const product of medusaProducts) {
            // Get all images for this product
            const images = getProductImages(product)
            const primaryImage = images[0] || product.thumbnail || null

            // Get first variant price as product price
            const productPrice = product.variants && product.variants.length > 0
                ? getVariantPrice(product.variants[0])
                : 0

            // Debug log first few products
            if (stats.products < 3) {
                console.log(`[Migration] Product: ${product.handle}`)
                console.log(`  - Images from API: ${product.images?.length || 0}`)
                console.log(`  - Extracted images: ${images.length}`)
                console.log(`  - Price: ${productPrice}`)
                console.log(`  - First variant prices:`, product.variants?.[0]?.prices)
            }

            // Get total inventory from variants
            const stockCount = product.variants?.reduce(
                (sum, v) => sum + (v.inventory_quantity || 0),
                0
            ) || 0

            // Get Supabase collection ID if product has collection
            const supabaseCollectionId = product.collection_id
                ? collectionIdMap.get(product.collection_id) || null
                : null

            // Get Supabase category ID if product has categories
            const supabaseCategoryId = product.categories && product.categories.length > 0
                ? categoryIdMap.get(product.categories[0].id) || null
                : null

            // Insert product
            const { data: insertedProduct, error: productError } = await supabase
                .from("products")
                .insert({
                    handle: product.handle,
                    name: product.title,
                    description: product.description,
                    status: product.status === "published" ? "active" : product.status,
                    thumbnail: product.thumbnail,
                    image_url: primaryImage,
                    images: images.length > 0 ? images : null,
                    price: productPrice,
                    stock_count: stockCount,
                    currency_code: "inr",
                    collection_id: supabaseCollectionId,
                    category_id: supabaseCategoryId,
                    subtitle: product.subtitle,
                    metadata: { medusa_id: product.id },
                })
                .select("id")
                .single()

            if (productError || !insertedProduct) {
                console.error(`[Migration] Error inserting product ${product.handle}:`, productError)
                continue
            }

            stats.products++

            // Insert variants for this product
            if (product.variants && product.variants.length > 0) {
                for (const variant of product.variants) {
                    const variantPrice = getVariantPrice(variant)

                    const { error: variantError } = await supabase
                        .from("product_variants")
                        .insert({
                            product_id: insertedProduct.id,
                            title: variant.title || "Default",
                            sku: variant.sku,
                            barcode: variant.barcode,
                            price: variantPrice,
                            inventory_quantity: variant.inventory_quantity || 0,
                            manage_inventory: variant.manage_inventory ?? true,
                            allow_backorder: variant.allow_backorder ?? false,
                            options: variant.options || [],
                            metadata: { medusa_variant_id: variant.id },
                        })

                    if (!variantError) {
                        stats.variants++
                    } else {
                        console.error(`[Migration] Error inserting variant for ${product.handle}:`, variantError)
                    }
                }
            }
        }

        // Revalidate paths
        revalidatePath("/admin/products")
        revalidatePath("/admin/collections")
        revalidatePath("/admin/categories")
        revalidatePath("/store")
        revalidatePath("/")

        console.log("[Migration] Complete!", stats)

        return NextResponse.json({
            success: true,
            message: "Migration completed successfully",
            stats,
        })

    } catch (error) {
        console.error("[Migration] Error:", error)
        return NextResponse.json({
            error: "Migration failed",
            details: error instanceof Error ? error.message : "Unknown error",
        }, { status: 500 })
    }
}
