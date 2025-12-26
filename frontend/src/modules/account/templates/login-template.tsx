"use client"

import { useMemo, useState } from "react"

import Register from "@modules/account/components/register"
import Login from "@modules/account/components/login"
import AuthShell from "@modules/account/components/auth-shell"

export enum LOGIN_VIEW {
  SIGN_IN = "sign-in",
  REGISTER = "register",
}

const LoginTemplate = () => {
  const [currentView, setCurrentView] = useState("sign-in")

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
      {currentView === "sign-in" ? (
        <Login setCurrentView={setCurrentView} />
      ) : (
        <Register setCurrentView={setCurrentView} />
      )}
    </AuthShell>
  )
}

export default LoginTemplate
