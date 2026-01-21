import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import * as fs from "fs"
import * as path from "path"

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase environment variables")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
    const migrationPath = path.join(process.cwd(), "supabase/migrations/20260120_add_payment_discount.sql")
    const sql = fs.readFileSync(migrationPath, "utf8")

    console.log("Running migration: 20260120_add_payment_discount.sql")

    const { error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
        if (error.message.includes("function exec_sql(text) does not exist")) {
            console.log("exec_sql RPC not found. Trying alternative method via raw SQL if available, or please run it in Supabase Dashboard.")
            console.error("Error:", error.message)
        } else {
            console.error("Migration failed:", error)
        }
        process.exit(1)
    }

    console.log("Migration successful!")
}

runMigration()
