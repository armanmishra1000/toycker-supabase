"use client"

import { Suspense, useMemo, useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"

import Register from "@modules/account/components/register"
import Login from "@modules/account/components/login"
import AuthShell from "@modules/account/components/auth-shell"
import ErrorMessage from "@modules/checkout/components/error-message"

export enum LOGIN_VIEW {
  SIGN_IN = "sign-in",
  REGISTER = "register",
}

const LoginTemplateContent = ({ returnUrl }: { returnUrl?: string }) => {
  const [currentView, setCurrentView] = useState<LOGIN_VIEW>(LOGIN_VIEW.SIGN_IN)
  const searchParams = useSearchParams()
  const router = useRouter()

  // Clear error from URL when view changes to avoid confusing persistent errors
  useEffect(() => {
    if (searchParams.has("auth_error") || searchParams.has("signup_success")) {
      const params = new URLSearchParams(searchParams.toString())
      params.delete("auth_error")
      params.delete("signup_success")
      const newUrl = params.toString() ? `?${params.toString()}` : ""
      router.replace(`${window.location.pathname}${newUrl}`, { scroll: false })
    }
  }, [currentView, router, searchParams])

  const authError = searchParams.get("auth_error")
  const signupSuccess = searchParams.get("signup_success")

  const errorMsg = authError === "invaild_or_expired_link"
    ? "The confirmation link is invalid or has expired. Please try signing up again or contact support."
    : null

  const infoMsg = signupSuccess === "true"
    ? "Check your email for the confirmation link to complete your signup."
    : null

  const copy = useMemo(
    () =>
      currentView === LOGIN_VIEW.SIGN_IN
        ? {
          title: "Welcome back",
          subtitle:
            "Sign in to access your saved addresses, order history, and a smoother checkout.",
        }
        : {
          title: "Join Toycker",
          subtitle:
            "Create your account to track orders, save addresses, and speed through checkout.",
        },
    [currentView]
  )

  return (
    <AuthShell
      title={copy.title}
      subtitle={copy.subtitle}
    >
      {errorMsg && (
        <div className="mb-4">
          <ErrorMessage error={errorMsg} />
        </div>
      )}
      {infoMsg && (
        <div className="mb-4">
          <ErrorMessage error={infoMsg} variant="info" />
        </div>
      )}
      {currentView === "sign-in" ? (
        <Login setCurrentView={setCurrentView} returnUrl={returnUrl} />
      ) : (
        <Register setCurrentView={setCurrentView} /> // Todo: Register might also need returnUrl
      )}
    </AuthShell>
  )
}

const LoginTemplate = (props: { returnUrl?: string }) => {
  return (
    <Suspense fallback={<div className="w-full h-full flex items-center justify-center p-8">Loading...</div>}>
      <LoginTemplateContent {...props} />
    </Suspense>
  )
}

export default LoginTemplate
