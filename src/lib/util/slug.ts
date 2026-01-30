/**
 * Converts a string into a URL-friendly slug (handle).
 * Example: "Action Figures" -> "action-figures"
 */
export const slugify = (text: string): string => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "") // Remove non-word characters (except spaces and dashes)
        .replace(/[\s_-]+/g, "-")  // Replace spaces and underscores with dashes
        .replace(/^-+|-+$/g, "")   // Remove leading and trailing dashes
}
