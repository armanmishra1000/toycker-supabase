"use server"

import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { CustomerProfile, Address } from "@/lib/supabase/types"

export const retrieveCustomer = cache(async (): Promise<CustomerProfile | null> => {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  const { data: addresses } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)

  return {
    id: user.id,
    email: user.email!,
    first_name: user.user_metadata?.first_name || "",
    last_name: user.user_metadata?.last_name || "",
    phone: user.phone || "",
    created_at: user.created_at,
    addresses: (addresses as Address[]) || [],
    is_club_member: user.user_metadata?.is_club_member || false,
    club_member_since: user.user_metadata?.club_member_since || null,
    total_club_savings: user.user_metadata?.total_club_savings || 0,
  }
})

export async function signup(_currentState: unknown, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const first_name = formData.get("first_name") as string
  const last_name = formData.get("last_name") as string
  const phone = formData.get("phone") as string

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name,
        last_name,
        phone,
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

  const returnUrl = formData.get("returnUrl") as string

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return error.message
  }

  revalidateTag("customers")

  // Check if user is an admin and redirect accordingly
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const ADMIN_EMAILS = ["admin@toycker.com", "tutanymo@fxzig.com"]
    const isHardcodedAdmin = ADMIN_EMAILS.includes(user.email || "")

    if (isHardcodedAdmin) {
      redirect("/admin")
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role === "admin") {
      redirect("/admin")
    }
  }

  redirect(returnUrl || "/account")
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  revalidateTag("customers")
  revalidateTag("cart")
  redirect("/")
}

export async function updateCustomer(data: Partial<CustomerProfile>) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("Not authenticated")
  }

  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      ...user.user_metadata,
      ...data,
    },
  })

  if (updateError) {
    throw updateError
  }

  revalidateTag("customers")
}

export async function addCustomerAddress(
  _currentState: unknown,
  formData: FormData
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const address = {
    user_id: user.id,
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    country_code: formData.get("country_code") as string,
    province: formData.get("province") as string,
    postal_code: formData.get("postal_code") as string,
    phone: formData.get("phone") as string,
  }

  const { error } = await supabase.from("addresses").insert(address)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidateTag("customers")
  return { success: true, error: null }
}

export async function updateCustomerAddress(
  _currentState: unknown,
  formData: FormData
) {
  const supabase = await createClient()
  const addressId = formData.get("addressId") as string

  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    country_code: formData.get("country_code") as string,
    province: formData.get("province") as string,
    postal_code: formData.get("postal_code") as string,
    phone: formData.get("phone") as string,
  }

  const { error } = await supabase
    .from("addresses")
    .update(address)
    .eq("id", addressId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidateTag("customers")
  return { success: true, error: null }
}

export async function deleteCustomerAddress(addressId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", addressId)

  if (error) {
    throw error
  }

  revalidateTag("customers")
}