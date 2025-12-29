
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createAdminClient = async () => {
    const cookieStore = await cookies()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseUrl) {
        throw new Error("NEXT_PUBLIC_SUPABASE_URL is not defined")
    }

    if (!serviceRoleKey) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is not defined. Please check your .env.local file.")
    }

    return createServerClient(
        supabaseUrl,
        serviceRoleKey,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )
}
