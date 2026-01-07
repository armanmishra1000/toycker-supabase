export type AdminNotificationType = "order" | "user" | "review"

export interface AdminNotification {
    id: string
    type: AdminNotificationType
    title: string
    message: string
    metadata: Record<string, unknown>
    is_read: boolean
    created_at: string
}

export interface RealtimePayload<T> {
    schema: string
    table: string
    commit_timestamp: string
    eventType: "INSERT" | "UPDATE" | "DELETE"
    new: T
    old: T
}
