import { Promotion } from "@/lib/supabase/types"

export type PromotionStatus = "active" | "scheduled" | "expired" | "deleted"

export function getPromotionStatus(promo: Promotion): PromotionStatus {
    if (promo.is_deleted) return "deleted"

    const now = new Date()
    const startsAt = promo.starts_at ? new Date(promo.starts_at) : null
    const endsAt = promo.ends_at ? new Date(promo.ends_at) : null

    if (endsAt && endsAt < now) return "expired"
    if (startsAt && startsAt > now) return "scheduled"

    return "active"
}
