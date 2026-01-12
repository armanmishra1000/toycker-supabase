"use client"

import { useActionState } from "react"
import Input from "@modules/common/components/input"
import { LOGIN_VIEW, LoginView } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { signup } from "@lib/data/customer"

type Props = {
  setCurrentView: (_view: LoginView) => void
}

const Register = ({ setCurrentView }: Props) => {
  const [state, formAction, isPending] = useActionState(signup, { success: true, data: undefined } as any)

  return (
    <div className="w-full flex flex-col gap-y-6" data-testid="register-page">
      <form className="w-full flex flex-col" action={formAction}>
        <div className="flex flex-col w-full gap-y-3">
          <Input
            label="First name"
            name="first_name"
            required
            disabled={isPending}
            autoComplete="given-name"
            data-testid="first-name-input"
          />
          <Input
            label="Last name"
            name="last_name"
            required
            disabled={isPending}
            autoComplete="family-name"
            data-testid="last-name-input"
          />
          <Input
            label="Email"
            name="email"
            required
            disabled={isPending}
            type="email"
            autoComplete="email"
            data-testid="email-input"
          />
          <Input
            label="Phone"
            name="phone"
            type="tel"
            disabled={isPending}
            autoComplete="tel"
            data-testid="phone-input"
          />
          <Input
            label="Password"
            name="password"
            required
            disabled={isPending}
            type="password"
            autoComplete="new-password"
            data-testid="password-input"
          />
        </div>
        <div aria-live="polite" className="min-h-[24px] mt-3">
          <ErrorMessage
            error={state?.success === false ? state.error : (state?.success === true ? state.data : null)}
            variant={state?.success === true ? "info" : "error"}
            data-testid="register-error"
          />
        </div>
        <span className="text-left text-ui-fg-subtle text-small-regular mt-4 leading-relaxed">
          By creating an account, you agree to Toycker Store&apos;s {" "}
          <LocalizedClientLink
            href="/content/privacy-policy"
            className="underline"
          >
            Privacy Policy
          </LocalizedClientLink>{" "}
          and {" "}
          <LocalizedClientLink
            href="/content/terms-of-use"
            className="underline"
          >
            Terms of Use
          </LocalizedClientLink>
          .
        </span>
        <SubmitButton
          className="w-full mt-4 rounded-xl py-4 bg-primary border-primary shadow-none hover:bg-foreground transition-all"
          isLoading={isPending}
          data-testid="register-button"
        >
          Join
        </SubmitButton>
      </form>
      <div className="flex flex-col gap-y-2 text-small-regular text-ui-fg-subtle">
        <span className="text-center">Already a member?</span>
        <div className="flex items-center justify-center gap-x-4">
          <button
            onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
            disabled={isPending}
            className="underline font-medium  text-black text-lg disabled:opacity-50"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  )
}

export default Register
