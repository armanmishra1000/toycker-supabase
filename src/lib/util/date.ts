/**
 * Formats a date string or object to Indian Standard Time (IST - Asia/Kolkata)
 * @param date - The date to format (string or Date object)
 * @param options - Optional formatting options
 * @returns Formatted date string
 */
export const formatIST = (
    date: string | Date,
    options: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    }
) => {
    try {
        const d = typeof date === "string" ? new Date(date) : date
        return new Intl.DateTimeFormat("en-IN", {
            ...options,
            timeZone: "Asia/Kolkata",
        }).format(d)
    } catch (e) {
        console.error("[formatIST] Failed to format date:", e)
        return typeof date === "string" ? date : date.toLocaleString()
    }
}

/**
 * Specifically for the simple time display (e.g., "10:34 AM")
 */
export const formatISTTime = (date: string | Date) => {
    return formatIST(date, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    })
}
