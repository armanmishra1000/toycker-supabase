import { Metadata } from "next"
import LoginTemplate from "@modules/account/templates/login-template"

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your account.",
}

type Props = {
  searchParams: Promise<{
    returnUrl?: string
  }>
}

export default async function Login(props: Props) {
  const searchParams = await props.searchParams
  return <LoginTemplate returnUrl={searchParams.returnUrl} />
}