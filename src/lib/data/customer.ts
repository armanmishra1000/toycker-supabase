"use server"

import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidateTag, revalidatePath } from "next/cache"
import { getAuthUser } from "./auth"
import { redirect } from "next/navigation"
import { CustomerProfile, Address } from "@/lib/supabase/types"
import { getBaseURL } from "@/lib/util/env"

export const retrieveCustomer = cache(async (): Promise<CustomerProfile | null> => {
  const user = await getAuthUser()
  const supabase = await createClient()

  if (!user) {
    return null
  }


  const { data: addresses } = await supabase
    .from("addresses")
    .select("id, first_name, last_name, address_1, address_2, city, province, postal_code, country_code, phone, company, is_default_billing, is_default_shipping")
    .eq("user_id", user.id)

  return {
    id: user.id,
    email: user.email!,
    first_name: user.user_metadata?.first_name || "",
    last_name: user.user_metadata?.last_name || "",
    phone: user.user_metadata?.phone || user.phone || "",
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

  // We rely on Supabase's built-in email collision check instead of a slow admin list
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name,
        last_name,
        phone,
      },
      emailRedirectTo: `${getBaseURL()}/auth/confirm`,
    },
  })

  console.log("Signup triggered for:", email, "Redirecting to:", `${getBaseURL()}/auth/confirm`)

  if (error) {
    return error.message
  }

  // Supabase "success" handling:
  // 1. If email is already in use, `identities` will be an empty array
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return "Email already in use. Please sign in instead."
  }

  // 2. If email confirmation is enabled and the user is new, `session` will be null
  if (data.user && !data.session) {
    console.log("Signup successful, requiring confirmation. Returning success message.")
    return "Check your email for the confirmation link to complete your signup."
  }

  revalidatePath("/", "layout")
  revalidatePath("/account", "layout")
  revalidateTag("customers")

  // redirect MUST NOT be in try-catch (it's not here, but being safe)
  redirect("/account")
}

export async function login(_currentState: unknown, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const returnUrl = formData.get("returnUrl") as string

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return error.message
  }

  let isAdmin = false

  // Check if user is an admin and redirect accordingly
  if (data.user) {
    const ADMIN_EMAILS = ["admin@toycker.com", "tutanymo@fxzig.com"]
    const isHardcodedAdmin = ADMIN_EMAILS.includes(data.user.email || "")

    if (isHardcodedAdmin) {
      isAdmin = true
    } else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single()

      if (profile?.role === "admin") {
        isAdmin = true
      }
    }
  }

  revalidatePath("/", "layout")
  revalidatePath("/account", "layout")
  revalidateTag("customers")

  if (isAdmin) {
    redirect("/admin")
  }

  redirect(returnUrl || "/account")
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  revalidateTag("customers")
  revalidateTag("cart")
  redirect("/account")
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
  revalidatePath("/", "layout")
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

  // Trimming inputs
  const first_name = (formData.get("first_name") as string || "").trim()
  const last_name = (formData.get("last_name") as string || "").trim()

  const address = {
    user_id: user.id,
    first_name,
    last_name,
    company: (formData.get("company") as string || "").trim(),
    address_1: (formData.get("address_1") as string || "").trim(),
    address_2: (formData.get("address_2") as string || "").trim(),
    city: (formData.get("city") as string || "").trim(),
    country_code: (formData.get("country_code") as string || "").trim().toLowerCase(),
    province: (formData.get("province") as string || "").trim(),
    postal_code: (formData.get("postal_code") as string || "").trim(),
    phone: (formData.get("phone") as string || "").trim(),
    is_default_billing: formData.get("isDefaultBilling") === "true",
    is_default_shipping: formData.get("isDefaultShipping") === "true",
  }

  // If adding a billing address through the profile and user has no addresses, make it default
  const { count } = await supabase
    .from("addresses")
    .select("*", { count: 'exact', head: true })
    .eq("user_id", user.id)

  if (count === 0) {
    address.is_default_billing = true
  }

  const { error } = await supabase.from("addresses").insert(address)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidateTag("customers")
  revalidatePath("/", "layout")
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
    is_default_billing: formData.get("isDefaultBilling") === "true",
    is_default_shipping: formData.get("isDefaultShipping") === "true",
  }

  const { error } = await supabase
    .from("addresses")
    .update(address)
    .eq("id", addressId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidateTag("customers")
  revalidatePath("/", "layout")
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