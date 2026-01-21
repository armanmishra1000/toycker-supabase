"use client"

import { Suspense, useMemo, useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"

import Register from "@modules/account/components/register"
import Login from "@modules/account/components/login"
import AuthShell from "@modules/account/components/auth-shell"
import ErrorMessage from "@modules/checkout/components/error-message"
import ForgotPassword from "@modules/account/components/forgot-password"

export const LOGIN_VIEW = {
  SIGN_IN: "sign-in",
  REGISTER: "register",
  FORGOT_PASSWORD: "forgot-password",
} as const
export type LoginView = (typeof LOGIN_VIEW)[keyof typeof LOGIN_VIEW]

const LoginTemplateContent = ({ returnUrl }: { returnUrl?: string }) => {
  const [currentView, setCurrentView] = useState<LoginView>(LOGIN_VIEW.SIGN_IN)
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
        : currentView === LOGIN_VIEW.REGISTER
          ? {
            title: "Join Toycker",
            subtitle:
              "Create your account to track orders, save addresses, and speed through checkout.",
          }
          : {
            title: "Forgot Password",
            subtitle:
              "Enter your email address and we'll send you a link to reset your password.",
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
      {currentView === LOGIN_VIEW.SIGN_IN ? (
        <Login setCurrentView={setCurrentView} returnUrl={returnUrl} />
      ) : currentView === LOGIN_VIEW.REGISTER ? (
        <Register setCurrentView={setCurrentView} /> // Todo: Register might also need returnUrl
      ) : (
        <ForgotPassword setCurrentView={setCurrentView} />
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
