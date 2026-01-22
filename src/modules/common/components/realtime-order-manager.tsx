"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@lib/supabase/client"

type RealtimeOrderManagerProps = {
    orderId: string
}

export const RealtimeOrderManager = ({ orderId }: RealtimeOrderManagerProps) => {
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const channel = supabase
            .channel(`order-manager-${orderId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `id=eq.${orderId}`,
                },
                () => {
                    // Update detected, refresh the server components
                    router.refresh()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [orderId, router, supabase])

    return null
}
