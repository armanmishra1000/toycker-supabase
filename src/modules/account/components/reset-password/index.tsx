"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@modules/common/context/toast-context"
import { resetPassword } from "@lib/data/customer"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"

const ResetPassword = ({ isRecovery = false }: { isRecovery?: boolean }) => {
    const { showToast } = useToast()
    const [state, formAction, isPending] = useActionState(resetPassword, { success: true, data: undefined } as any)

    const router = useRouter()
    useEffect(() => {
        if (state?.success === true && state?.data) {
            showToast(state.data, "success", "Success!")
            setTimeout(() => {
                router.push("/account")
            }, 2000)
        } else if (state?.success === false && state?.error) {
            showToast(state.error, "error", "Reset Failed")
        }
    }, [state, showToast, router])
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    const passwordsMatch = password === confirmPassword && password !== ""

    return (
        <div className="w-full" data-testid="reset-password-form">
            <form className="w-full flex flex-col" action={formAction}>
                <div className="flex flex-col w-full gap-y-3">
                    {!isRecovery && (
                        <Input
                            label="Old Password"
                            name="old_password"
                            type="password"
                            autoComplete="current-password"
                            required
                            disabled={isPending}
                            data-testid="old-password-input"
                        />
                    )}
                    <Input
                        label="New Password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        required
                        disabled={isPending}
                        onChange={(e) => setPassword(e.target.value)}
                        data-testid="new-password-input"
                    />
                    <Input
                        label="Confirm Password"
                        name="confirm_password"
                        type="password"
                        autoComplete="new-password"
                        required
                        disabled={isPending}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        data-testid="confirm-password-input"
                    />
                </div>
                {!passwordsMatch && confirmPassword !== "" && (
                    <div className="text-rose-500 text-small-regular mt-2">
                        Passwords do not match
                    </div>
                )}
                <div aria-live="polite" className="min-h-[24px] mt-3">
                </div>
                <SubmitButton
                    data-testid="reset-password-button"
                    isLoading={isPending}
                    disabled={!passwordsMatch || isPending}
                    className="w-full mt-4 rounded-xl py-4 bg-primary border-primary shadow-none hover:bg-foreground transition-all disabled:opacity-50"
                >
                    Reset Password
                </SubmitButton>
            </form>
        </div>
    )
}

export default ResetPassword
