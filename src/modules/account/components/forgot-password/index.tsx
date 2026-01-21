"use client"

import { requestPasswordReset } from "@lib/data/customer"
import { LOGIN_VIEW, LoginView } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import { useToast } from "@modules/common/context/toast-context"
import { useActionState, useEffect } from "react"

type Props = {
    setCurrentView: (_view: LoginView) => void
}

const ForgotPassword = ({ setCurrentView }: Props) => {
    const { showToast } = useToast()
    const [state, formAction, isPending] = useActionState(requestPasswordReset, { success: false, data: null } as any)

    useEffect(() => {
        if (state?.success === true && state?.data === "success") {
            showToast(
                "If an account exists for this email, you will receive a password reset link shortly.",
                "success",
                "Email Sent"
            )
        } else if (state?.success === false && state?.error) {
            showToast(state.error, "error", "Request Failed")
        }
    }, [state, showToast])

    return (
        <div className="w-full flex flex-col gap-y-6" data-testid="forgot-password-page">
            <form className="w-full flex flex-col" action={formAction}>
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
                </div>
                <div aria-live="polite" className="min-h-[24px] mt-3">
                    {state?.success === false && state?.error && (
                        <ErrorMessage error={state.error} data-testid="forgot-password-error-message" />
                    )}
                </div>
                <SubmitButton
                    data-testid="reset-password-button"
                    isLoading={isPending}
                    className="w-full mt-4 rounded-xl py-4 bg-primary border-primary shadow-none hover:bg-foreground transition-all"
                >
                    Send Reset Link
                </SubmitButton>
            </form>
            <div className="flex flex-col gap-y-2 text-small-regular text-ui-fg-subtle">
                <span className="text-center">Remember your password?</span>
                <div className="flex items-center justify-center gap-x-4">
                    <button
                        onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
                        disabled={isPending}
                        className="underline font-semibold text-black text-lg disabled:opacity-50"
                        data-testid="back-to-sign-in-button"
                    >
                        Back to Sign In
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ForgotPassword
