"use server"

import { createClient } from "@/lib/supabase/server"
import { Promotion } from "@/lib/supabase/types"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { ensureAdmin } from "./admin"

export async function getAdminPromotions(): Promise<Promotion[]> {
    await ensureAdmin()
    const supabase = await createClient()
    const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
}

export async function getPromotion(id: string): Promise<Promotion> {
    await ensureAdmin()
    const supabase = await createClient()
    const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .eq("id", id)
        .eq("is_deleted", false)
        .single()

    if (error) throw error
    return data
}

export async function createPromotion(formData: FormData) {
    await ensureAdmin()
    const supabase = await createClient()

    const promotion = {
        code: (formData.get("code") as string).toUpperCase(),
        type: formData.get("type") as "percentage" | "fixed" | "free_shipping",
        value: parseFloat(formData.get("value") as string || "0"),
        min_order_amount: parseFloat(formData.get("min_order_amount") as string || "0"),
        is_active: formData.get("is_active") === "on",
        starts_at: formData.get("starts_at") ? new Date(formData.get("starts_at") as string).toISOString() : new Date().toISOString(),
        ends_at: formData.get("ends_at") ? new Date(formData.get("ends_at") as string).toISOString() : null,
        max_uses: formData.get("max_uses") ? parseInt(formData.get("max_uses") as string) : null,
    }

    const { error } = await supabase.from("promotions").insert(promotion)
    if (error) throw new Error(error.message)

    revalidatePath("/admin/discounts")
    redirect("/admin/discounts")
}

export async function deletePromotion(id: string) {
    await ensureAdmin()
    const supabase = await createClient()
    const { error } = await supabase
        .from("promotions")
        .update({ is_deleted: true, is_active: false })
        .eq("id", id)

    if (error) throw error
    revalidatePath("/admin/discounts")
}

export async function togglePromotion(id: string, isActive: boolean) {
    await ensureAdmin()
    const supabase = await createClient()
    const { error } = await supabase
        .from("promotions")
        .update({ is_active: isActive })
        .eq("id", id)

    if (error) throw error
    revalidatePath("/admin/discounts")
}

export async function updatePromotion(id: string, formData: FormData) {
    await ensureAdmin()
    const supabase = await createClient()

    const promotion = {
        code: (formData.get("code") as string).toUpperCase(),
        type: formData.get("type") as "percentage" | "fixed" | "free_shipping",
        value: parseFloat(formData.get("value") as string || "0"),
        min_order_amount: parseFloat(formData.get("min_order_amount") as string || "0"),
        is_active: formData.get("is_active") === "on",
        starts_at: formData.get("starts_at")
            ? new Date(formData.get("starts_at") as string).toISOString()
            : new Date().toISOString(),
        ends_at: formData.get("ends_at")
            ? new Date(formData.get("ends_at") as string).toISOString()
            : null,
        max_uses: formData.get("max_uses") ? parseInt(formData.get("max_uses") as string) : null,
    }

    const { error } = await supabase.from("promotions").update(promotion).eq("id", id)
    if (error) throw new Error(error.message)

    revalidatePath("/admin/discounts")
    redirect("/admin/discounts")
}
