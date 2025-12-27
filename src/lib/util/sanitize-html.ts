export const sanitizeRichText = (input?: string | null): string => {
  if (!input) {
    return ""
  }

  // Simple pass-through for trusted content from our database
  // In a production environment with user-generated content, you might want to use a server-compatible sanitizer
  return input
}

export const extractPlainText = (input?: string | null): string => {
  if (!input) {
    return ""
  }

  // Simple regex to strip HTML tags
  const withoutTags = input.replace(/<[^>]*>/g, " ")
  return withoutTags.replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim()
}