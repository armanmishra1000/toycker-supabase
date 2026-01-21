"use client"

import { useActionState, useEffect } from "react"
import { useToast } from "@modules/common/context/toast-context"
import { login } from "@lib/data/customer"
import { LOGIN_VIEW, LoginView } from "@modules/account/templates/login-template"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"

type Props = {
  setCurrentView: (_view: LoginView) => void
  returnUrl?: string
}

const Login = ({ setCurrentView, returnUrl }: Props) => {
  const { showToast } = useToast()
  const [state, formAction, isPending] = useActionState(login, { success: true, data: undefined } as any)

  useEffect(() => {
    if (state?.success === false && state?.error) {
      showToast(state.error, "error", "Login Failed")
    }
  }, [state, showToast])

  return (
    <div className="w-full flex flex-col gap-y-6" data-testid="login-page">
      <form className="w-full flex flex-col" action={formAction}>
        <input type="hidden" name="returnUrl" value={returnUrl || ""} />
        <div className="flex flex-col w-full gap-y-3">
          <Input
            label="Email"
            name="email"
            type="email"
            title="Enter a valid email address."
            autoComplete="email"
            required
            disabled={isPending}
            data-testid="email-input"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={isPending}
          />
        </div>
        <div className="flex justify-end mt-2">
          <button
            type="button"
            onClick={() => setCurrentView(LOGIN_VIEW.FORGOT_PASSWORD)}
            className="text-small-regular text-ui-fg-subtle hover:text-black transition-colors underline"
            data-testid="forgot-password-link"
          >
            Forgot password?
          </button>
        </div>
        <div aria-live="polite" className="min-h-[24px] mt-3">
        </div>
        <SubmitButton
          data-testid="sign-in-button"
          isLoading={isPending}
          className="w-full mt-4 rounded-xl py-4 bg-primary border-primary shadow-none hover:bg-foreground transition-all"
        >
          Sign in
        </SubmitButton>
      </form>
      <div className="flex flex-col gap-y-2 text-small-regular text-ui-fg-subtle">
        <span className="text-center">Need an account?</span>
        <div className="flex items-center justify-center gap-x-4">
          <button
            onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
            disabled={isPending}
            className="underline font-semibold text-black text-lg disabled:opacity-50"
            data-testid="register-button"
          >
            Join Toycker
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login
