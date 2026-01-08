import { cache } from "react"
import { createClient } from "@/lib/supabase/server"

/**
 * Deduplicated auth user fetcher. 
 * React cache() ensures this only hits the network once per request, 
 * even if called in middleware, root layout, and page.
 */
export const getAuthUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
})
