"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@lib/supabase/client"

export default function RealtimeOrdersListener() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel("admin-orders-list")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router, supabase])

  return null
}
