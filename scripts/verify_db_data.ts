import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function verify() {
    console.log('--- Checking payment_providers data ---')

    const { data, error } = await supabase
        .from('payment_providers')
        .select('*')

    if (error) {
        console.error('ERROR:', error)
    } else {
        console.log('SUCCESS: Providers found:', data?.length)
        console.log('Sample provider:', data?.[0])
    }
}

verify()
