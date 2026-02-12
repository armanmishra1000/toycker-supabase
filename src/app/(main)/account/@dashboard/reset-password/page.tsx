import ResetPasswordTemplate from "@modules/account/templates/reset-password-template"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Reset Password",
    description: "Reset your Toycker account password.",
}

export default async function ResetPasswordPage({
    searchParams,
}: {
    searchParams: Promise<{ mode?: string }>
}) {
    const { mode } = await searchParams
    return <ResetPasswordTemplate isRecovery={mode === "recovery"} />
}
