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

  // Check if dashboard has actual content (not just default null)
  // We use a simple check: if dashboard is not null/undefined, it's a sub-page
  const hasDashboard = dashboard !== null && dashboard !== undefined

  return (
    <AccountLayout customer={customer}>
      {hasDashboard ? dashboard : children}
    </AccountLayout>
  )
}