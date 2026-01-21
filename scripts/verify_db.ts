import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function verify() {
    console.log('--- Checking discount_percentage column ---')

    const { data, error } = await supabase
        .from('payment_providers')
        .select('discount_percentage')
        .limit(1)

    if (error) {
        console.error('ERROR:', error)
    } else {
        console.log('SUCCESS: Column exists. Data:', data)
    }
}

verify()
