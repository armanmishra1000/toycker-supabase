import { login } from "@lib/data/customer"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import { useActionState } from "react"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Login = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(login, null)

  return (
    <div className="w-full flex flex-col gap-y-6" data-testid="login-page">
      <form className="w-full flex flex-col" action={formAction}>
        <div className="flex flex-col w-full gap-y-3">
          <Input
            label="Email"
            name="email"
            type="email"
            title="Enter a valid email address."
            autoComplete="email"
            required
            data-testid="email-input"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            data-testid="password-input"
          />
        </div>
        <div aria-live="polite" className="min-h-[24px] mt-3">
          <ErrorMessage error={message} data-testid="login-error-message" />
        </div>
        <SubmitButton data-testid="sign-in-button" className="w-full mt-4 rounded-xl py-4 bg-primary border-primary shadow-none hover:bg-foreground transition-all">
          Sign in
        </SubmitButton>
      </form>
      <div className="flex flex-col gap-y-2 text-small-regular text-ui-fg-subtle">
        <span className="text-center">Need an account?</span>
        <div className="flex items-center justify-center gap-x-4">
          <button
            onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
            className="underline font-semibold text-black text-lg"
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
