import ResetPasswordTemplate from "@modules/account/templates/reset-password-template"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Reset Password",
    description: "Reset your Toycker account password.",
}

export default function ResetPasswordPage() {
    return <ResetPasswordTemplate />
}
