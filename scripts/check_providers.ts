
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkProviders() {
    const { data, error } = await supabase.from("payment_providers").select("*")
    if (error) {
        console.error("Error fetching providers:", error)
    } else {
        console.table(data.map(p => ({
            id: p.id,
            name: p.name,
            is_active: p.is_active,
            discount: p.discount_percentage
        })))
    }
}

checkProviders()
