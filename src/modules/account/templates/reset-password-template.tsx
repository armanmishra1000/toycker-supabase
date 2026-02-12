"use client"

import ResetPassword from "@modules/account/components/reset-password"
import AuthShell from "@modules/account/components/auth-shell"

const ResetPasswordTemplate = ({ isRecovery = false }: { isRecovery?: boolean }) => {
    return (
        <div className="w-full">
            <div className="mb-8 flex flex-col gap-y-4">
                <h1 className="text-2xl-semi">
                    {isRecovery ? "Set New Password" : "Change Password"}
                </h1>
                <p className="text-base-regular">
                    {isRecovery
                        ? "Enter your new password below to regain access to your account."
                        : "Enter your current password and choose a new one."}
                </p>
            </div>
            <div className="max-w-xl">
                <ResetPassword isRecovery={isRecovery} />
            </div>
        </div>
    )
}

export default ResetPasswordTemplate
