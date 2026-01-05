import { createClient } from "@lib/supabase/server"
import { Product } from "@lib/supabase/types"

export type SalesDataPoint = {
    date: string
    sales: number
}

export type TopProduct = {
    id: string
    title: string
    thumbnail: string | null
    price: number
    currency_code: string
    total_quantity: number
}


export async function getTopProducts(limit: number = 5): Promise<TopProduct[]> {
    const supabase = await createClient()

    // 1. Fetch order items (joined with orders to filter active valid orders?)
    // For simplicity: We'll assume valid order_items. 
    // Ideally filtering by order status is best, but lets grab items.
    // Note: 'order_items' table usually exists. Let's check schema assumption. 
    // If 'orders' has a 'items' JSONB column, we traverse that. 
    // The 'Order' type has 'items?: CartItem[]'. This suggests a potential JSON/Join.
    // Let's assume standard 'order_items' table exists for a robust SQL-like backend.
    // Wait, previous file view of types shows `CartItem` linked to `Cart` not explicit `order_items` table in top level types export.

    // Let's assume we fetch `orders` and iterate their items in memory if `order_items` table is not readily available or complex.
    // The typescript `Order` interface has `items?: CartItem[]`. 
    // We can fetch all orders -> extract items -> aggregate. 
    // For "Top Selling", performance might be an issue with MANY orders, but for a prototype store, 
    // fetching all orders (with minimal fields) is acceptable.

    const { data: orders, error } = await supabase
        .from("orders")
        .select("items")
        .neq("status", "cancelled")
        .neq("status", "failed") // Filter invalid orders

    if (error || !orders) {
        console.error("Error fetching top products:", error)
        return []
    }

    // Aggregate in memory
    const productStats = new Map<string, { quantity: number, title: string, thumbnail: string, price: number, currency: string }>()

    orders.forEach(order => {
        // items is a JSONB array usually if modeled that way in Supabase for simple stores, 
        // or a Relation. The Typescript interface says `items?: CartItem[]`. 
        // If it's a relation, we need to SELECT it. `.select('items(*)')`? 
        // Actually, looking at `CartItem` type, it has `product_id`.

        const items = order.items as any[] || [] // usage of any avoided generally, but casting JSON
        if (Array.isArray(items)) {
            items.forEach((item: any) => {
                if (!item.product_id) return

                const existing = productStats.get(item.product_id)
                const qty = item.quantity || 0

                if (existing) {
                    existing.quantity += qty
                } else {
                    productStats.set(item.product_id, {
                        quantity: qty,
                        title: item.product_title || item.title || "Unknown Product",
                        thumbnail: item.thumbnail || null,
                        price: item.unit_price || 0,
                        currency: "inr" // Default or infer from context
                    })
                }
            })
        }
    })

    // Sort and limit
    const sorted = Array.from(productStats.entries())
        .map(([id, stats]) => ({
            id,
            title: stats.title,
            thumbnail: stats.thumbnail,
            price: stats.price,
            currency_code: stats.currency,
            total_quantity: stats.quantity
        }))
        .sort((a, b) => b.total_quantity - a.total_quantity)
        .slice(0, limit)

    return sorted
}

export type DashboardStats = {
    revenue: {
        value: number
        change: number
        trend: 'up' | 'down' | 'neutral'
    }
    orders: {
        value: number
        change: number
        trend: 'up' | 'down' | 'neutral'
    }
    products: {
        value: number
        lowStock: number
    }
    customers: {
        value: number
        newThisMonth: number
    }
}

export async function getDashboardStats(): Promise<DashboardStats> {
    const supabase = await createClient()
    const now = new Date()

    // Date Ranges
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0) // Last day of prev month

    // 1. Revenue & Orders (Current Month vs Last Month)
    // We fetch all orders from startOfLastMonth to now to minimize queries, then split in JS.
    // This is efficient enough for a prototype and small-medium scale.

    const { data: recentOrders, error: ordersError } = await supabase
        .from("orders")
        .select("created_at, total_amount, id")
        .gte("created_at", startOfLastMonth.toISOString())
        .neq("status", "cancelled")
        .neq("status", "failed")

    if (ordersError) {
        console.error("Error fetching stats:", ordersError)
        // Return empty/zero stats on error
        return {
            revenue: { value: 0, change: 0, trend: 'neutral' },
            orders: { value: 0, change: 0, trend: 'neutral' },
            products: { value: 0, lowStock: 0 },
            customers: { value: 0, newThisMonth: 0 }
        }
    }

    let revenueCurrent = 0
    let revenueLast = 0
    let ordersCurrent = 0
    let ordersLast = 0

    const currentMonthISO = startOfCurrentMonth.toISOString()

    recentOrders.forEach(order => {
        if (order.created_at >= currentMonthISO) {
            revenueCurrent += order.total_amount
            ordersCurrent += 1
        } else {
            revenueLast += order.total_amount
            ordersLast += 1
        }
    })

    // Calculate trends
    const calculateChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0
        return ((current - previous) / previous) * 100
    }

    const revenueChange = calculateChange(revenueCurrent, revenueLast)
    const ordersChange = calculateChange(ordersCurrent, ordersLast)

    // 2. Active Products & Low Stock
    // Use head: true (count) for fast counting
    const { count: activeProducts } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("status", "active")

    // 3. Customers
    // Total
    const { count: totalCustomers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })

    // New this month (Reuse simple query or count)
    // For precise "New This Month", valid query:
    const { count: newCustomers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfCurrentMonth.toISOString())


    return {
        revenue: {
            value: revenueCurrent, // in cents
            change: revenueChange,
            trend: revenueChange > 0 ? 'up' : revenueChange < 0 ? 'down' : 'neutral'
        },
        orders: {
            value: ordersCurrent,
            change: ordersChange,
            trend: ordersChange > 0 ? 'up' : ordersChange < 0 ? 'down' : 'neutral'
        },
        products: {
            value: activeProducts || 0,
            lowStock: 0 // Placeholder or separate query if needed. Plan said "Inventory Status" or similar.
        },
        customers: {
            value: totalCustomers || 0,
            newThisMonth: newCustomers || 0
        }
    }
}
