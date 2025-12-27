export const getBaseURL = () => {
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"
}