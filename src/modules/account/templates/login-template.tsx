"use client"

import { Suspense } from "react"

import PhoneLogin from "@modules/account/components/phone-login"
import AuthShell from "@modules/account/components/auth-shell"

const LoginTemplateContent = () => {
  return (
    <AuthShell
      title="Welcome to Toycker"
      subtitle="Enter your WhatsApp number to continue"
    >
      <PhoneLogin />
    </AuthShell>
  )
}

const LoginTemplate = (_props: { returnUrl?: string }) => {
  return (
    <Suspense fallback={<div className="w-full h-full flex items-center justify-center p-8">Loading...</div>}>
      <LoginTemplateContent />
    </Suspense>
  )
}

export default LoginTemplate
