"use server"

import crypto from "crypto"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath, revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { ActionResult } from "@/lib/types/action-result"

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 10) return `91${digits}`
  if (digits.length === 12 && digits.startsWith("91")) return digits
  return digits
}

function validatePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "")
  // 10 digits starting with 6-9
  if (digits.length === 10) return /^[6-9]\d{9}$/.test(digits)
  // 12 digits with 91 prefix
  if (digits.length === 12 && digits.startsWith("91")) return /^91[6-9]\d{9}$/.test(digits)
  return false
}

export async function sendOtp(
  _currentState: unknown,
  formData: FormData
): Promise<ActionResult> {
  const phone = (formData.get("phone") as string || "").trim()

  if (!validatePhone(phone)) {
    return { success: false, error: "Enter a valid 10-digit Indian mobile number" }
  }

  const normalizedPhone = normalizePhone(phone)
  const adminClient = await createAdminClient()

  // Rate limit: check if OTP was sent in last 60 seconds
  const { data: recentOtp } = await adminClient
    .from("otp_codes")
    .select("created_at")
    .eq("phone", normalizedPhone)
    .gte("created_at", new Date(Date.now() - 60_000).toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (recentOtp) {
    return { success: false, error: "Please wait 60 seconds before requesting another OTP" }
  }

  const code = crypto.randomInt(100000, 999999).toString()
  const expiresAt = new Date(Date.now() + 5 * 60_000).toISOString()

  const { error: insertError } = await adminClient
    .from("otp_codes")
    .insert({ phone: normalizedPhone, code, expires_at: expiresAt })

  if (insertError) {
    return { success: false, error: "Failed to generate OTP. Please try again." }
  }

  // Send OTP via GOWA WhatsApp API
  const gowaUrl = process.env.GOWA_API_URL
  const gowaUser = process.env.GOWA_API_USER
  const gowaPassword = process.env.GOWA_API_PASSWORD
  const gowaDeviceId = process.env.GOWA_DEVICE_ID

  if (!gowaUrl || !gowaUser || !gowaPassword || !gowaDeviceId) {
    return { success: false, error: "WhatsApp service not configured" }
  }

  const authHeader = Buffer.from(`${gowaUser}:${gowaPassword}`).toString("base64")

  const response = await fetch(`${gowaUrl}/send/message`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${authHeader}`,
      "Content-Type": "application/json",
      "X-Device-Id": gowaDeviceId,
    },
    body: JSON.stringify({
      phone: `${normalizedPhone}@s.whatsapp.net`,
      message: `Your Toycker login code is: ${code}\n\nThis code expires in 5 minutes. Do not share it with anyone.`,
    }),
  })

  if (!response.ok) {
    return { success: false, error: "Failed to send OTP. Please try again." }
  }

  return { success: true, data: undefined }
}

export async function verifyOtp(
  _currentState: unknown,
  formData: FormData
): Promise<ActionResult> {
  const phone = (formData.get("phone") as string || "").trim()
  const code = (formData.get("code") as string || "").trim()

  if (!validatePhone(phone)) {
    return { success: false, error: "Invalid phone number" }
  }

  if (!/^\d{6}$/.test(code)) {
    return { success: false, error: "Enter a valid 6-digit code" }
  }

  const normalizedPhone = normalizePhone(phone)
  const adminClient = await createAdminClient()

  // Get latest non-expired, non-verified OTP for this phone
  const { data: otpRecord, error: otpError } = await adminClient
    .from("otp_codes")
    .select("id, code, attempts")
    .eq("phone", normalizedPhone)
    .eq("verified", false)
    .gte("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (otpError || !otpRecord) {
    return { success: false, error: "OTP expired or not found. Please request a new one." }
  }

  // Check max attempts
  if (otpRecord.attempts >= 5) {
    return { success: false, error: "Too many attempts. Please request a new OTP." }
  }

  // Increment attempts
  await adminClient
    .from("otp_codes")
    .update({ attempts: otpRecord.attempts + 1 })
    .eq("id", otpRecord.id)

  // Compare code
  if (otpRecord.code !== code) {
    return { success: false, error: "Incorrect OTP. Please try again." }
  }

  // Mark as verified
  await adminClient
    .from("otp_codes")
    .update({ verified: true })
    .eq("id", otpRecord.id)

  // Derive synthetic email
  const syntheticEmail = `${normalizedPhone}@wa.toycker.store`

  // Check if user exists via profiles table
  const { data: existingProfile } = await adminClient
    .from("profiles")
    .select("id")
    .eq("phone", normalizedPhone)
    .maybeSingle()

  let userId: string

  if (existingProfile) {
    userId = existingProfile.id

    // Ensure user has the synthetic email set (in case they were created before this flow)
    await adminClient.auth.admin.updateUserById(userId, {
      email: syntheticEmail,
      email_confirm: true,
      phone: normalizedPhone,
      phone_confirm: true,
    })
  } else {
    // Also check by synthetic email (in case profile phone wasn't set yet)
    const { data: { users: existingUsers } } = await adminClient.auth.admin.listUsers()
    const existingUser = existingUsers?.find(u => u.email === syntheticEmail)

    if (existingUser) {
      userId = existingUser.id
    } else {
      // Create new user
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: syntheticEmail,
        phone: normalizedPhone,
        phone_confirm: true,
        email_confirm: true,
        user_metadata: { phone: normalizedPhone },
      })

      if (createError || !newUser.user) {
        return { success: false, error: "Failed to create account. Please try again." }
      }

      userId = newUser.user.id
    }

    // Update profile with phone
    await adminClient
      .from("profiles")
      .update({ phone: normalizedPhone })
      .eq("id", userId)
  }

  // Generate magic link to create a session
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email: syntheticEmail,
  })

  if (linkError || !linkData.properties?.hashed_token) {
    return { success: false, error: "Failed to create session. Please try again." }
  }

  // Exchange token for session using the server client (which has cookie access)
  const serverClient = await createClient()
  const { error: sessionError } = await serverClient.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: "magiclink",
  })

  if (sessionError) {
    return { success: false, error: "Failed to sign in. Please try again." }
  }

  // Revalidate caches
  revalidatePath("/", "layout")
  revalidatePath("/account", "layout")
  revalidateTag("customers", "max")

  // Check admin role for redirect
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single()

  if (profile?.role === "admin") {
    redirect("/admin")
  }

  redirect("/account")
}
