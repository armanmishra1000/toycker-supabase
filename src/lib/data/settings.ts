"use server"

import { createClient } from "@/lib/supabase/server"
import { GlobalSettings } from "@/lib/supabase/types"
import { revalidateTag, unstable_cache } from "next/cache"

const getGlobalSettingsInternal = async (): Promise<GlobalSettings> => {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("global_settings")
        .select("*")
        .eq("id", "default")
        .single()

    if (error || !data) {
        return {
            id: "default",
            gift_wrap_fee: 50,
            is_gift_wrap_enabled: true,
            updated_at: new Date().toISOString()
        }
    }

    return data as GlobalSettings
}

export const getGlobalSettings = async () =>
    unstable_cache(
        getGlobalSettingsInternal,
        ["global-settings"],
        { revalidate: 3600, tags: ["global_settings"] }
    )()

export async function updateGlobalSettings(settings: Partial<GlobalSettings>) {
    const supabase = await createClient()

    const { error } = await supabase
        .from("global_settings")
        .update({
            ...settings,
            updated_at: new Date().toISOString()
        })
        .eq("id", "default")

    if (error) {
        throw new Error(`Failed to update settings: ${error.message}`)
    }

    revalidateTag("global_settings")
}
