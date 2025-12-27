export const getBaseURL = () => {
  // 1. Priority: Custom Environment Variable (e.g., set in Vercel Settings or .env.local)
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL
  }

  // 2. Explicit Production URL (Hardcoded preference for payment stability)
  // This ensures that we use the main domain for callbacks instead of dynamic preview URLs
  if (process.env.NODE_ENV === "production") {
    return "https://toycker-supabase.vercel.app"
  }

  // 3. Vercel System Variables (Fallbacks for Preview deployments)
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  }
  
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // 4. Local Development
  return "http://localhost:8000"
}