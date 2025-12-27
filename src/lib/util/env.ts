export const getBaseURL = () => {
  // 1. Priority: Custom Environment Variable (e.g., set in Vercel Settings)
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL
  }

  // 2. Fallback: Hardcoded Production URL (if variable is missing in prod)
  if (process.env.NODE_ENV === "production") {
    return "https://toycker-supabase.vercel.app"
  }

  // 3. Development: Localhost
  return "http://localhost:8000"
}