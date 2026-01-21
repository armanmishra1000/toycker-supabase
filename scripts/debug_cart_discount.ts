
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugCartDiscount() {
    // Get the most recent cart
    const { data: carts, error } = await supabase
        .from("carts")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)

    if (error || !carts || carts.length === 0) {
        console.error("No carts found", error)
        return
    }

    const cartData = carts[0]
    console.log("Cart ID:", cartData.id)
    console.log("Payment Collection:", JSON.stringify(cartData.payment_collection, null, 2))

    const selectedPaymentProviderId = cartData.payment_collection?.payment_sessions?.find(
        (s: any) => s.status === "pending"
    )?.provider_id

    console.log("Selected Provider ID:", selectedPaymentProviderId)

    if (selectedPaymentProviderId) {
        const { data: provider } = await supabase
            .from("payment_providers")
            .select("*")
            .eq("id", selectedPaymentProviderId)
            .maybeSingle()

        console.log("Provider Data:", JSON.stringify(provider, null, 2))
    } else {
        console.log("No pending payment session found.")
    }
}

debugCartDiscount()
