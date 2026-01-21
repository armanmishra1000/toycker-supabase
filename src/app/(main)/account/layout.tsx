import React from "react"
import { retrieveCustomer } from "@lib/data/customer"
import AccountLayout from "@modules/account/templates/account-layout"
import LoginTemplate from "@modules/account/templates/login-template"

export default async function AccountPageLayout({
  dashboard,
  children,
}: {
  dashboard: React.ReactNode
  children: React.ReactNode
}) {
  const customer = await retrieveCustomer()

  if (!customer) {
    return <LoginTemplate />
  }

  return (
    <AccountLayout customer={customer}>
      {dashboard || children}
    </AccountLayout>
  )
}