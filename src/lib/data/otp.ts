"use server"

import crypto from "crypto"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { sendAiSensyAuthenticationOtp } from "@/lib/integrations/aisensy"
import { revalidatePath, revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { ActionResult } from "@/lib/types/action-result"

type SendOtpResult = ActionResult<{ cooldownSeconds: number }>
type ProfileLookup = {
  id: string
  email: string | null
  role: string | null
}

const DEFAULT_RESEND_COOLDOWN_SECONDS = 60
const DEFAULT_OTP_TTL_SECONDS = 300
const DEFAULT_OTP_MAX_ATTEMPTS = 5
const DEFAULT_WHATSAPP_LOGIN_EMAIL_DOMAIN = "wa.toycker.store"

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

function getNumericEnv(key: string, fallbackValue: number): number {
  const rawValue = process.env[key]?.trim()

  if (!rawValue) {
    return fallbackValue
  }

  const parsedValue = Number.parseInt(rawValue, 10)

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return fallbackValue
  }

  return parsedValue
}

function getOtpHashSecret(): string {
  const secret = process.env.OTP_HASH_SECRET?.trim()

  if (!secret) {
    throw new Error("OTP_HASH_SECRET is not configured")
  }

  return secret
}

function getSyntheticEmail(normalizedPhone: string): string {
  const domain =
    process.env.WHATSAPP_LOGIN_EMAIL_DOMAIN?.trim() ||
    DEFAULT_WHATSAPP_LOGIN_EMAIL_DOMAIN

  return `${normalizedPhone}@${domain}`
}

function hashOtp(phone: string, code: string): string {
  return crypto
    .createHmac("sha256", getOtpHashSecret())
    .update(`${phone}:${code}`)
    .digest("hex")
}

function compareOtpHash(expectedHash: string | null, phone: string, code: string): boolean {
  try {
    if (!expectedHash) {
      return false
    }

    const providedHash = hashOtp(phone, code)

    return crypto.timingSafeEqual(
      Buffer.from(expectedHash, "hex"),
      Buffer.from(providedHash, "hex")
    )
  } catch {
    return false
  }
}

function sanitizeRedirectPath(value: string | null): string | null {
  const trimmedValue = value?.trim()

  if (!trimmedValue || !trimmedValue.startsWith("/") || trimmedValue.startsWith("//")) {
    return null
  }

  return trimmedValue
}

function getRequestedRedirectPath(formData: FormData): string | null {
  return (
    sanitizeRedirectPath(formData.get("returnUrl") as string | null) ||
    sanitizeRedirectPath(formData.get("next") as string | null)
  )
}

async function findUniqueProfile(
  adminClient: Awaited<ReturnType<typeof createAdminClient>>,
  field: "phone" | "email",
  value: string
): Promise<{ row: ProfileLookup | null; duplicate: boolean; failed: boolean }> {
  const { data, error } = await adminClient
    .from("profiles")
    .select("id, email, role")
    .eq(field, value)
    .limit(2)

  if (error || !data) {
    return { row: null, duplicate: false, failed: true }
  }

  if (data.length > 1) {
    return { row: null, duplicate: true, failed: false }
  }

  return {
    row: (data[0] as ProfileLookup | undefined) ?? null,
    duplicate: false,
    failed: false,
  }
}

async function syncAuthUserPhone(
  adminClient: Awaited<ReturnType<typeof createAdminClient>>,
  userId: string,
  normalizedPhone: string,
  emailPatch?: { email: string; email_confirm: true }
): Promise<boolean> {
  const { data: existingUserData, error: existingUserError } =
    await adminClient.auth.admin.getUserById(userId)

  if (existingUserError) {
    console.warn("Failed to load existing auth user before phone sync:", existingUserError)
  }

  const existingUserMetadata =
    existingUserData.user?.user_metadata &&
    typeof existingUserData.user.user_metadata === "object" &&
    !Array.isArray(existingUserData.user.user_metadata)
      ? (existingUserData.user.user_metadata as Record<string, unknown>)
      : {}

  const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
    ...emailPatch,
    phone: normalizedPhone,
    phone_confirm: true,
    user_metadata: {
      ...existingUserMetadata,
      phone: normalizedPhone,
      phone_number: normalizedPhone,
    },
  })

  if (updateError) {
    console.error("Failed to sync auth user phone during OTP verification:", updateError)
    return false
  }

  return true
}

export async function sendOtp(
  _currentState: unknown,
  formData: FormData
): Promise<SendOtpResult> {
  const phone = ((formData.get("phone") as string) || "").trim()
  const resendCooldownSeconds = getNumericEnv(
    "OTP_RESEND_COOLDOWN_SECONDS",
    DEFAULT_RESEND_COOLDOWN_SECONDS
  )
  const otpTtlSeconds = getNumericEnv("OTP_TTL_SECONDS", DEFAULT_OTP_TTL_SECONDS)

  if (!validatePhone(phone)) {
    return { success: false, error: "Enter a valid 10-digit Indian mobile number" }
  }

  try {
    getOtpHashSecret()
  } catch {
    return { success: false, error: "WhatsApp OTP service is not configured." }
  }

  const normalizedPhone = normalizePhone(phone)
  const adminClient = await createAdminClient()

  // Rate limit: check if OTP was sent in last 60 seconds
  const { data: recentOtp } = await adminClient
    .from("otp_codes")
    .select("created_at")
    .eq("phone", normalizedPhone)
    .gte(
      "created_at",
      new Date(Date.now() - resendCooldownSeconds * 1000).toISOString()
    )
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (recentOtp) {
    return {
      success: false,
      error: `Please wait ${resendCooldownSeconds} seconds before requesting another OTP`,
    }
  }

  const code = crypto.randomInt(100000, 999999).toString()
  const codeHash = hashOtp(normalizedPhone, code)
  const now = new Date().toISOString()
  const expiresAt = new Date(Date.now() + otpTtlSeconds * 1000).toISOString()

  await adminClient
    .from("otp_codes")
    .update({
      expires_at: now,
      consumed_at: now,
      delivery_status: "failed",
    })
    .eq("phone", normalizedPhone)
    .eq("verified", false)
    .is("consumed_at", null)
    .gte("expires_at", now)

  const { data: createdOtp, error: insertError } = await adminClient
    .from("otp_codes")
    .insert({
      phone: normalizedPhone,
      code_hash: codeHash,
      expires_at: expiresAt,
      delivery_status: "pending",
    })
    .select("id")
    .single()

  if (insertError) {
    console.error("Failed to create OTP record:", insertError)
    return { success: false, error: "Failed to generate OTP. Please try again." }
  }

  try {
    const { providerMessageId } = await sendAiSensyAuthenticationOtp({
      destination: normalizedPhone,
      otpCode: code,
      userName: "Toycker Customer",
    })

    await adminClient
      .from("otp_codes")
      .update({
        delivery_status: "sent",
        provider_message_id: providerMessageId ?? null,
      })
      .eq("id", createdOtp.id)
  } catch (error) {
    await adminClient
      .from("otp_codes")
      .update({
        delivery_status: "failed",
        consumed_at: new Date().toISOString(),
      })
      .eq("id", createdOtp.id)

    console.error("Failed to send AiSensy OTP:", error)

    return {
      success: false,
      error:
        "Failed to send the WhatsApp OTP. Please check the AiSensy configuration and try again.",
    }
  }

  return {
    success: true,
    data: {
      cooldownSeconds: resendCooldownSeconds,
    },
  }
}

export async function verifyOtp(
  _currentState: unknown,
  formData: FormData
): Promise<ActionResult> {
  const phone = ((formData.get("phone") as string) || "").trim()
  const code = ((formData.get("code") as string) || "").trim()
  const maxAttempts = getNumericEnv("OTP_MAX_ATTEMPTS", DEFAULT_OTP_MAX_ATTEMPTS)
  const requestedRedirectPath = getRequestedRedirectPath(formData)

  if (!validatePhone(phone)) {
    return { success: false, error: "Invalid phone number" }
  }

  if (!/^\d{6}$/.test(code)) {
    return { success: false, error: "Enter a valid 6-digit code" }
  }

  try {
    getOtpHashSecret()
  } catch {
    return { success: false, error: "WhatsApp OTP service is not configured." }
  }

  const normalizedPhone = normalizePhone(phone)
  const adminClient = await createAdminClient()

  // Get latest non-expired, non-verified OTP for this phone
  const { data: otpRecord, error: otpError } = await adminClient
    .from("otp_codes")
    .select("id, code_hash, attempts")
    .eq("phone", normalizedPhone)
    .eq("verified", false)
    .eq("delivery_status", "sent")
    .is("consumed_at", null)
    .gte("expires_at", new Date().toISOString())
    .not("code_hash", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (otpError || !otpRecord) {
    return { success: false, error: "OTP expired or not found. Please request a new one." }
  }

  // Check max attempts
  if (otpRecord.attempts >= maxAttempts) {
    await adminClient
      .from("otp_codes")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", otpRecord.id)

    return { success: false, error: "Too many attempts. Please request a new OTP." }
  }

  const nextAttemptCount = otpRecord.attempts + 1

  await adminClient
    .from("otp_codes")
    .update({ attempts: nextAttemptCount })
    .eq("id", otpRecord.id)

  if (!compareOtpHash(otpRecord.code_hash, normalizedPhone, code)) {
    if (nextAttemptCount >= maxAttempts) {
      await adminClient
        .from("otp_codes")
        .update({ consumed_at: new Date().toISOString() })
        .eq("id", otpRecord.id)
    }

    return { success: false, error: "Incorrect OTP. Please try again." }
  }

  // Mark as verified
  await adminClient
    .from("otp_codes")
    .update({ verified: true, consumed_at: new Date().toISOString() })
    .eq("id", otpRecord.id)

  const syntheticEmail = getSyntheticEmail(normalizedPhone)
  const profileByPhone = await findUniqueProfile(adminClient, "phone", normalizedPhone)

  if (profileByPhone.failed) {
    return { success: false, error: "Failed to verify your account. Please try again." }
  }

  if (profileByPhone.duplicate) {
    return {
      success: false,
      error:
        "This phone number is linked to multiple accounts. Please contact support.",
    }
  }

  let userId: string
  let loginEmail = syntheticEmail
  let isAdmin = false

  if (profileByPhone.row) {
    userId = profileByPhone.row.id
    loginEmail = profileByPhone.row.email || syntheticEmail
    isAdmin = profileByPhone.row.role === "admin"

    const authUserSynced = await syncAuthUserPhone(
      adminClient,
      userId,
      normalizedPhone,
      profileByPhone.row.email ? undefined : { email: syntheticEmail, email_confirm: true }
    )

    if (!authUserSynced) {
      return { success: false, error: "Failed to verify your account. Please try again." }
    }
  } else {
    const profileByEmail = await findUniqueProfile(adminClient, "email", syntheticEmail)

    if (profileByEmail.failed) {
      return {
        success: false,
        error: "Failed to verify your account. Please try again.",
      }
    }

    if (profileByEmail.duplicate) {
      return {
        success: false,
        error:
          "This WhatsApp login email is linked to multiple accounts. Please contact support.",
      }
    }

    if (profileByEmail.row) {
      userId = profileByEmail.row.id
      loginEmail = profileByEmail.row.email || syntheticEmail
      isAdmin = profileByEmail.row.role === "admin"

      const authUserSynced = await syncAuthUserPhone(
        adminClient,
        userId,
        normalizedPhone,
        profileByEmail.row.email ? undefined : { email: syntheticEmail, email_confirm: true }
      )

      if (!authUserSynced) {
        return { success: false, error: "Failed to verify your account. Please try again." }
      }
    } else {
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: syntheticEmail,
        phone: normalizedPhone,
        phone_confirm: true,
        email_confirm: true,
        user_metadata: { phone: normalizedPhone, phone_number: normalizedPhone },
      })

      if (createError || !newUser.user) {
        return { success: false, error: "Failed to create account. Please try again." }
      }

      userId = newUser.user.id
      loginEmail = syntheticEmail
    }
  }

  const { error: profileUpdateError } = await adminClient
    .from("profiles")
    .update({ phone: normalizedPhone })
    .eq("id", userId)

  if (profileUpdateError) {
    console.warn("Failed to sync phone to profile during OTP verification:", profileUpdateError)
  }

  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email: loginEmail,
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

  if (isAdmin) {
    redirect("/admin")
  }

  redirect(requestedRedirectPath || "/account")
}
