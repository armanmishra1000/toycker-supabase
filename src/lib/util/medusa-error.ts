type ErrorWithResponse = Error & {
  response?: {
    data: { message?: string } | string
    status?: number
    headers?: unknown
  }
  config?: {
    url?: string
    baseURL?: string
  }
}

type ErrorWithRequest = Error & {
  request?: unknown
}

export default function medusaError(error: unknown): never {
  // Handle Error objects
  if (error instanceof Error) {
    const err = error as ErrorWithResponse

    if (err.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const url = err.config?.url
        ? new URL(err.config.url, err.config.baseURL || "").toString()
        : "Unknown URL"

      console.error("Resource:", url)
      console.error("Response data:", err.response.data)
      console.error("Status code:", err.response.status)
      console.error("Headers:", err.response.headers)

      // Extracting the error message from the response data
      const data = err.response.data
      let message = ""

      if (typeof data === "string") {
        message = data
      } else if (data && typeof data === "object" && "message" in data) {
        message = String(data.message)
      } else {
        message = "An error occurred"
      }

      const formatted = message.charAt(0).toUpperCase() + message.slice(1)
      throw new Error(formatted + (formatted.endsWith(".") ? "" : "."))
    }

    const reqErr = error as ErrorWithRequest
    if (reqErr.request) {
      // The request was made but no response was received
      throw new Error("No response received. Please check your connection.")
    }

    // Something happened in setting up the request that triggered an Error
    throw new Error("Error setting up the request: " + error.message)
  }

  // Handle string errors
  if (typeof error === "string") {
    throw new Error(error.charAt(0).toUpperCase() + error.slice(1) + ".")
  }

  // Handle unknown errors
  throw new Error("An unexpected error occurred. Please try again.")
}
