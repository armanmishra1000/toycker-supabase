import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
    process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function checkFunction() {
    console.log('Checking for function in database...')

    // Test 1: As Array
    console.log('Test 1: Calling as array...')
    const res1 = await supabase.rpc('search_products_multimodal', {
        search_query: null,
        search_embedding: new Array(512).fill(0),
        match_threshold: 0.1,
        match_count: 1
    })
    if (res1.error) console.log('Test 1 Error:', res1.error.message)
    else console.log('Test 1 Success!')

    // Test 2: As String
    console.log('\nTest 2: Calling as stringified array...')
    const res2 = await supabase.rpc('search_products_multimodal', {
        search_query: null,
        search_embedding: `[${new Array(512).fill(0).join(',')}]`,
        match_threshold: 0.1,
        match_count: 1
    })
    // Test 3: Text Only
    console.log('\nTest 3: Calling with text only (no embedding)...')
    const res3 = await supabase.rpc('search_products_multimodal', {
        search_query: 'toy',
        match_threshold: 0.1,
        match_count: 5
    })
    if (res3.error) console.log('Test 3 Error:', res3.error.message)
    else console.log('Test 3 Success!')
}

checkFunction()
