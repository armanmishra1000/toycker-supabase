import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function verify() {
    console.log('--- Checking carts table structure ---')

    const { data, error } = await supabase
        .from('carts')
        .select('*')
        .limit(1)

    if (error) {
        console.error('ERROR:', error)
    } else {
        console.log('SUCCESS: Carts columns:', Object.keys(data?.[0] || {}))
        console.log('payment_collection value type:', typeof data?.[0]?.payment_collection)
    }
}

verify()
