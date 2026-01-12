"use server"

import { createClient } from "@/lib/supabase/server"
import { PaymentProvider } from "@/lib/supabase/types"

export const listCartPaymentMethods = async (_regionId: string) => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("payment_providers")
    .select("id, name, description")
    .eq("is_active", true)

  if (error) {
    console.error("Error fetching payment methods:", error.message)
    // Fallback if DB query fails
    return [
      {
        id: "pp_payu_payu",
        name: "PayU",
      }
    ]
  }

  return data.map((method: Partial<PaymentProvider>) => ({
    id: method.id!,
    name: method.name!,
  }))
}