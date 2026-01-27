import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { generateImageEmbedding } from '../lib/ml/embeddings'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function backfill() {
    console.log('Starting image embedding backfill...')

    // 1. Fetch all products missing embeddings
    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, thumbnail, image_url')
        .is('image_embedding', null)

    if (error) {
        console.error('Error fetching products:', error.message)
        return
    }

    console.log(`Found ${products.length} products to process.`)

    const BATCH_SIZE = 5
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
        const batch = products.slice(i, i + BATCH_SIZE)
        console.log(`\nProcessing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(products.length / BATCH_SIZE)}...`)

        await Promise.all(batch.map(async (product) => {
            const imageUrl = product.thumbnail || product.image_url

            if (!imageUrl) {
                console.warn(`- Skipping ${product.name}: No image URL`)
                return
            }

            try {
                console.log(`- Generating embedding for: ${product.name}`)
                const embedding = await generateImageEmbedding(imageUrl)

                const { error: updateError } = await supabase
                    .from('products')
                    .update({ image_embedding: embedding })
                    .eq('id', product.id)

                if (updateError) {
                    console.error(`  Error updating ${product.name}:`, updateError.message)
                } else {
                    console.log(`  ✅ Success: ${product.name}`)
                }
            } catch (err) {
                console.error(`  ❌ Failed ${product.name}:`, err instanceof Error ? err.message : String(err))
            }
        }))
    }

    console.log('\nBackfill complete!')
}

backfill()
