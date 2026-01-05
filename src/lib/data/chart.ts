"use server"

import { createClient } from "@lib/supabase/server"

export type ChartDataPoint = {
    date: string
    sales: number
    orders: number
}

export type TimePeriod = "1w" | "2w" | "1m" | "1y"

export async function getChartData(period: TimePeriod): Promise<ChartDataPoint[]> {
    const supabase = await createClient()
    const now = new Date()
    let startDate = new Date()
    let groupBy: "day" | "month" = "day"

    switch (period) {
        case "1w":
            startDate.setDate(now.getDate() - 7)
            break
        case "2w":
            startDate.setDate(now.getDate() - 14)
            break
        case "1m":
            startDate.setDate(now.getDate() - 30)
            break
        case "1y":
            startDate.setMonth(now.getMonth() - 11) // 12 months including current
            startDate.setDate(1) // Start of that month
            groupBy = "month"
            break
    }

    const { data: orders, error } = await supabase
        .from("orders")
        .select("created_at, total_amount")
        .gte("created_at", startDate.toISOString())
        .neq("status", "cancelled")
        .neq("status", "failed")
        .order("created_at", { ascending: true })

    if (error || !orders) {
        console.error("Error fetching chart data:", error)
        return []
    }

    const dataMap = new Map<string, { sales: number; orders: number; dateInfo: Date }>()

    // Initialize map with all intervals to ensure no gaps
    if (groupBy === "day") {
        for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
            const key = d.toISOString().split("T")[0]
            dataMap.set(key, { sales: 0, orders: 0, dateInfo: new Date(d) })
        }
    } else {
        // Month grouping
        const startM = new Date(startDate)
        // iterate months
        for (let i = 0; i < 12; i++) {
            const d = new Date(startM.getFullYear(), startM.getMonth() + i, 1)
            if (d > now && d.getMonth() !== now.getMonth()) break // Stop if future, allowing current partial month
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            dataMap.set(key, { sales: 0, orders: 0, dateInfo: d })
        }
    }

    orders.forEach((order) => {
        const d = new Date(order.created_at)
        let key = ""
        if (groupBy === "day") {
            key = d.toISOString().split("T")[0]
        } else {
            key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        }

        const current = dataMap.get(key)
        if (current) {
            current.sales += order.total_amount
            current.orders += 1
        }
    })

    // Format keys for display
    const result = Array.from(dataMap.values()).map(item => {
        let displayDate = ""
        if (groupBy === "day") {
            displayDate = item.dateInfo.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        } else {
            displayDate = item.dateInfo.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
        }

        return {
            date: displayDate,
            sales: item.sales / 100, // Convert cents to whole
            orders: item.orders
        }
    })

    return result
}
