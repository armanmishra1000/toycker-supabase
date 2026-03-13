"use server"

import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import { revalidateTag, revalidatePath } from "next/cache"
import { getAuthUser } from "./auth"
import { redirect } from "next/navigation"
import { removeCartId } from "./cookies"
import { CustomerProfile, Address } from "@/lib/supabase/types"
import { getCustomerFacingEmail } from "@/lib/util/customer-email"

export const retrieveCustomer = cache(
  async (): Promise<CustomerProfile | null> => {
    const user = await getAuthUser()
    const supabase = await createClient()

    if (!user) {
      return null
    }

    const { data: addresses } = await supabase
      .from("addresses")
      .select(
        "id, first_name, last_name, address_1, address_2, city, province, postal_code, country_code, phone, company, is_default_billing, is_default_shipping"
      )
      .eq("user_id", user.id)

    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "first_name, last_name, phone, email, contact_email, is_club_member, club_member_since, total_club_savings"
      )
      .eq("id", user.id)
      .single()

    return {
      id: user.id,
      email:
        getCustomerFacingEmail(
          profile?.contact_email,
          profile?.email,
          user.email
        ) || "",
      first_name: user.user_metadata?.first_name || profile?.first_name || "",
      last_name: user.user_metadata?.last_name || profile?.last_name || "",
      phone:
        user.user_metadata?.phone_number ||
        user.user_metadata?.phone ||
        user.phone ||
        profile?.phone ||
        "",
      created_at: user.created_at,
      addresses: (addresses as Address[]) || [],
      is_club_member:
        profile?.is_club_member ?? user.user_metadata?.is_club_member ?? false,
      club_member_since:
        profile?.club_member_since ??
        user.user_metadata?.club_member_since ??
        null,
      total_club_savings: Number(
        profile?.total_club_savings ?? user.user_metadata?.total_club_savings ?? 0
      ),
    }
  }
)

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  await removeCartId()

  revalidateTag("customers", "max")
  revalidateTag("cart", "max")
  redirect("/account")
}

export async function updateCustomer(data: Partial<CustomerProfile>) {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("Not authenticated")
  }

  const { email, ...metadataPatch } = data
  const normalizedEmail = email?.trim() || null

  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      ...user.user_metadata,
      ...metadataPatch,
      phone_number: data.phone || user.user_metadata?.phone_number,
    },
  })

  if (updateError) {
    throw updateError
  }

  if (email !== undefined) {
    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({ contact_email: normalizedEmail })
      .eq("id", user.id)

    if (profileUpdateError) {
      throw profileUpdateError
    }
  }

  revalidateTag("customers", "max")
  revalidateTag("admin-customers", "max")
  revalidatePath("/", "layout")
  revalidatePath("/admin/customers", "layout")
}

export async function addCustomerAddress(
  _currentState: unknown,
  formData: FormData
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Trimming inputs
  const first_name = ((formData.get("first_name") as string) || "").trim()
  const last_name = ((formData.get("last_name") as string) || "").trim()

  const address = {
    user_id: user.id,
    first_name,
    last_name,
    company: ((formData.get("company") as string) || "").trim(),
    address_1: ((formData.get("address_1") as string) || "").trim(),
    address_2: ((formData.get("address_2") as string) || "").trim(),
    city: ((formData.get("city") as string) || "").trim(),
    country_code: ((formData.get("country_code") as string) || "")
      .trim()
      .toLowerCase(),
    province: ((formData.get("province") as string) || "").trim(),
    postal_code: ((formData.get("postal_code") as string) || "").trim(),
    phone: ((formData.get("phone") as string) || "").trim(),
    is_default_billing: formData.get("isDefaultBilling") === "true",
    is_default_shipping: formData.get("isDefaultShipping") === "true",
  }

  // If adding a billing address through the profile and user has no addresses, make it default
  const { count } = await supabase
    .from("addresses")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  if (count === 0) {
    address.is_default_billing = true
  }

  const { error } = await supabase.from("addresses").insert(address)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidateTag("customers", "max")
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

  revalidateTag("customers", "max")
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

  revalidateTag("customers", "max")
}
