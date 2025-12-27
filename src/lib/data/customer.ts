"use server"

import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"

export const retrieveCustomer = cache(async () => {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  // Map Supabase user to the expected customer shape
  return {
    id: user.id,
    email: user.email,
    first_name: user.user_metadata?.first_name || "",
    last_name: user.user_metadata?.last_name || "",
    phone: user.phone || "",
    metadata: user.user_metadata,
  }
})

export async function signup(_currentState: unknown, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const first_name = formData.get("first_name") as string
  const last_name = formData.get("last_name") as string

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name,
        last_name,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback`,
    },
  })

  if (error) {
    return error.message
  }

  revalidateTag("customers")
  redirect("/account")
}

export async function login(_currentState: unknown, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return error.message
  }

  revalidateTag("customers")
  redirect("/account")
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  revalidateTag("customers")
  revalidateTag("cart")
  redirect("/")
}
