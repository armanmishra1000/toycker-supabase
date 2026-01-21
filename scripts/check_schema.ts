
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for schema info

if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase URL and Key are required")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
    const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'carts' })
    if (error) {
        // If RPC doesn't exist, try getting a single row and checking keys
        const { data: row, error: rowError } = await supabase.from('carts').select('*').limit(1).maybeSingle()
        if (rowError) {
            console.error("Error fetching row:", rowError)
        } else if (row) {
            console.log("Columns found in a row:", Object.keys(row))
        } else {
            console.log("No rows found in carts table.")
        }
    } else {
        console.log("Table Columns:", data)
    }
}

checkSchema()
