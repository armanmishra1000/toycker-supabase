import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
    process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function checkEmbeddings() {
    console.log('Checking product embeddings status...')

    const { data, error, count } = await supabase
        .from('products')
        .select('id, name, image_embedding', { count: 'exact' })

    if (error) {
        console.error('Error fetching products:', error.message)
        return
    }

    const withEmbedding = data.filter(p => p.image_embedding).length
    const withoutEmbedding = data.length - withEmbedding

    console.log(`Total products: ${data.length}`)
    console.log(`Products with embeddings: ${withEmbedding}`)
    console.log(`Products without embeddings: ${withoutEmbedding}`)

    if (withoutEmbedding > 0) {
        console.log('\nSample products missing embeddings:')
        data.filter(p => !p.image_embedding).slice(0, 5).forEach(p => {
            console.log(`- ${p.name} (${p.id})`)
        })
    }
}

checkEmbeddings()
