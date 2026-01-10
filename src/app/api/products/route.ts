import { NextResponse } from "next/server"
import { listProducts } from "@/lib/data/products"

export async function GET() {
    try {
        const { response } = await listProducts()

        return NextResponse.json({
            products: response.products.map((p) => ({
                id: p.id,
                title: p.name,
                handle: p.handle,
                thumbnail: p.image_url,
            })),
        })
    } catch (error) {
        console.error("Error fetching products:", error)
        return NextResponse.json(
            { error: "Failed to fetch products" },
            { status: 500 }
        )
    }
}
