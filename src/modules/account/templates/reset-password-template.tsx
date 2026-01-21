"use client"

import ResetPassword from "@modules/account/components/reset-password"
import AuthShell from "@modules/account/components/auth-shell"

const ResetPasswordTemplate = () => {
    return (
        <div className="w-full">
            <div className="mb-8 flex flex-col gap-y-4">
                <h1 className="text-2xl-semi">Reset Password</h1>
                <p className="text-base-regular">
                    Enter your new password below to regain access to your account.
                </p>
            </div>
            <div className="max-w-xl">
                <ResetPassword />
            </div>
        </div>
    )
}

export default ResetPasswordTemplate
