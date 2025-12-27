"use server"

import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { CustomerProfile } from "@/lib/supabase/types"

export const retrieveCustomer = cache(async () => {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  const { data: addresses } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)

  // Map Supabase user to the expected customer shape
  return {
    id: user.id,
    email: user.email,
    first_name: user.user_metadata?.first_name || "",
    last_name: user.user_metadata?.last_name || "",
    phone: user.phone || "",
    metadata: user.user_metadata,
    addresses: addresses || [],
    created_at: user.created_at,
  } as unknown as CustomerProfile
})

export async function signup(_currentState: unknown, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const first_name = formData.get("first_name") as string
  const last_name = formData.get("last_name") as string
  const phone = formData.get("phone") as string

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
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