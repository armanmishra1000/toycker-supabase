"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@lib/supabase/client"
import AuthShell from "@modules/account/components/auth-shell"
import { Loader2 } from "lucide-react"
import ErrorMessage from "@modules/checkout/components/error-message"

const ConfirmContent = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [error, setError] = useState<string | null>(null)
    const [isVerifying, setIsVerifying] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const code = searchParams.get("code")
        const token_hash = searchParams.get("token_hash")
        const type = searchParams.get("type")

        if (!code && !token_hash) {
            setError("No verification code found in the URL. Please check your email link.")
            setIsVerifying(false)
            return
        }

        const performVerification = async () => {
            try {
                console.log("DEBUG: Current browser cookies:", document.cookie)

                // 1. Check if we already have a session (maybe another tab was faster or bot already confirmed it)
                const { data: { session: existingSession } } = await supabase.auth.getSession()
                if (existingSession) {
                    console.log("Existing session found, redirecting to account...")
                    router.push("/account")
                    return
                }

                if (code) {
                    console.log("Starting client-side PKCE verification for code...")
                    const { error } = await supabase.auth.exchangeCodeForSession(code)

                    if (error) {
                        console.error("Client verification error:", error.message)

                        // Re-check session in case the exchange actually worked but returned an error (unlikely but safe)
                        const { data: { session: afterErrorSession } } = await supabase.auth.getSession()
                        if (afterErrorSession) {
                            router.push("/account")
                            return
                        }

                        const isPkceError = error.message.toLowerCase().includes("pkce code verifier not found")

                        if (isPkceError) {
                            console.log("PKCE verifier missing on client. Falling back to server-side callback...")
                            // REDIRECT TO CALLBACK: This is our safety net. 
                            // The callback route can check if the user is already logged in or handle non-PKCE links.
                            const callbackUrl = new URL("/api/auth/callback", window.location.origin)
                            searchParams.forEach((v, k) => callbackUrl.searchParams.set(k, v))
                            window.location.href = callbackUrl.toString()
                            return
                        }

                        // Handle already used / expired links
                        if (error.message.toLowerCase().includes("otp_expired") || error.message.toLowerCase().includes("already being used") || error.message.toLowerCase().includes("invalid_grant")) {
                            setError("This link has already been verified or has expired. Please try signing in - you are likely already confirmed!")
                        } else {
                            setError(error.message)
                        }
                        setIsVerifying(false)
                    } else {
                        console.log("Verification successful! Redirecting...")
                        router.push("/account")
                    }
                } else if (token_hash && type) {
                    console.log("Starting client-side OTP verification...")
                    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any })
                    if (error) {
                        setError(error.message)
                        setIsVerifying(false)
                    } else {
                        router.push("/account")
                    }
                }
            } catch (err: any) {
                console.error("Verification failed:", err)
                setError("An unexpected error occurred. Please try again.")
                setIsVerifying(false)
            }
        }

        performVerification()
    }, [searchParams, router, supabase])

    return (
        <AuthShell
            title={isVerifying ? "Verifying your email" : "Verification Failed"}
            subtitle={isVerifying ? "Please wait a moment while we confirm your account..." : "There was a problem confirming your email."}
        >
            <div className="flex flex-col items-center justify-center min-h-[150px] space-y-4">
                {isVerifying && (
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                )}

                {error && (
                    <div className="w-full max-w-sm">
                        <ErrorMessage error={error} />
                        <button
                            onClick={() => router.push("/account")}
                            className="mt-6 w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors"
                        >
                            Back to Sign In
                        </button>
                    </div>
                )}
            </div>
        </AuthShell>
    )
}

export default function ConfirmPage() {
    return (
        <Suspense fallback={
            <AuthShell title="Loading..." subtitle="Preparing verification...">
                <div className="flex items-center justify-center min-h-[150px]">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                </div>
            </AuthShell>
        }>
            <ConfirmContent />
        </Suspense>
    )
}
