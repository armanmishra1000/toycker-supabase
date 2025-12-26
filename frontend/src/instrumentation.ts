export function register() {
  if (process.env.NODE_ENV === "development") {
    console.info("[Instrumentation] Registered server hooks")
  }
}
