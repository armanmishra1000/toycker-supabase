import { NextResponse } from "next/server"
import { retrieveCustomer } from "@/lib/data/customer"

/**
 * GET /api/customer
 * Returns the current authenticated customer's profile data
 */
export async function GET() {
    try {
        const customer = await retrieveCustomer()

        if (!customer) {
            return NextResponse.json({ is_club_member: false }, { status: 200 })
        }

        return NextResponse.json(
            {
                id: customer.id,
                email: customer.email,
                first_name: customer.first_name,
                last_name: customer.last_name,
                is_club_member: customer.is_club_member,
                club_member_since: customer.club_member_since,
                total_club_savings: customer.total_club_savings,
            },
            { status: 200 }
        )
    } catch (error) {
        console.error("Error fetching customer:", error)
        return NextResponse.json(
            { error: "Failed to fetch customer data", is_club_member: false },
            { status: 500 }
        )
    }
}
