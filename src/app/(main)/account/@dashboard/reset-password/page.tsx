import { redirect } from "next/navigation"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Reset Password",
    description: "Reset your Toycker account password.",
}

export default async function ResetPasswordPage() {
    redirect("/account")
}
