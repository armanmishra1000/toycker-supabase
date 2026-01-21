import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function verify() {
    console.log('--- Checking cart data content ---')

    const { data, error } = await supabase
        .from('carts')
        .select('id, payment_collection, shipping_methods')
        .order('updated_at', { ascending: false })
        .limit(1)

    if (error) {
        console.error('ERROR:', error)
    } else {
        console.log('SUCCESS: Cart data:', JSON.stringify(data?.[0], null, 2))
    }
}

verify()
