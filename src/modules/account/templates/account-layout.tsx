import React from "react"
import UnderlineLink from "@modules/common/components/interactive-link"
import AccountNav from "../components/account-nav"

interface AccountLayoutProps {
  customer: any
  children: React.ReactNode
}

const AccountLayout: React.FC<AccountLayoutProps> = ({
  customer,
  children,
}) => {
  const hasCustomer = !!customer

  const firstName = customer?.first_name ?? ""
  const email = customer?.email ?? ""

  return (
    <div className="flex-1" data-testid="account-page">
      <div className="flex-1 content-container h-full max-w-6xl mx-auto flex flex-col gap-y-8 small:py-12 py-8">
        {hasCustomer && (
          <div className="rounded-lg border border-gray-200 bg-white px-6 py-6 small:px-8 small:py-8 shadow-sm">
            <div className="flex flex-col gap-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Account
              </p>
              <h1 className="text-2xl font-semibold">Welcome back, {firstName}</h1>
              <p className="text-sm text-gray-500">
                Signed in as <span className="font-semibold text-gray-900">{email}</span>
              </p>
            </div>
          </div>
        )}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          {hasCustomer ? (
            <div className="grid grid-cols-1 small:grid-cols-[260px_1fr] gap-0">
              <div className="border-b small:border-b-0 small:border-r border-gray-200 p-6 small:p-8">
                <AccountNav customer={customer} />
              </div>
              <div className="flex-1 p-6 small:p-8">{children}</div>
            </div>
          ) : (
            <div className="p-6 small:p-8">{children}</div>
          )}
        </div>
        <div className="flex flex-col small:flex-row items-start small:items-center justify-between border border-gray-200 rounded-lg bg-white px-6 py-6 small:px-8 small:py-8 gap-6 shadow-sm">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Got questions?</h3>
            <span className="text-sm text-gray-500">
              Find quick answers and common questions on our customer service page.
            </span>
          </div>
          <UnderlineLink href="/contact">Customer Service</UnderlineLink>
        </div>
      </div>
    </div>
  )
}

export default AccountLayout
