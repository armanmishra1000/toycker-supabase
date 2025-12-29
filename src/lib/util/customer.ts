// Format customer display ID helper
// This is a client-safe utility function

export function formatCustomerDisplayId(displayId: number | null | undefined): string {
    if (!displayId) return "—"
    return `TOYCKER-${displayId}`
}
