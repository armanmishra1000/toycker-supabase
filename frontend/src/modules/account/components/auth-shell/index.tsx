"use client"

import React from "react"

type AuthShellProps = {
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

const AuthShell = ({ title, subtitle, children, footer }: AuthShellProps) => {
  return (
    <div className="w-full flex justify-center px-4 py-12 bg-ui-bg-subtle rounded-lg">
      <div className="w-full max-w-2xl shadow-card rounded-xl bg-ui-bg-base border border-ui-border">
        <div className="flex flex-col gap-y-6 p-8 small:p-10">
          <div className="space-y-3 text-center">
            <h1 className="text-2xl-semi" data-testid="auth-shell-title">
              {title}
            </h1>
            {subtitle && (
              <p
                className="text-base-regular text-ui-fg-subtle leading-relaxed"
                data-testid="auth-shell-subtitle"
              >
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-y-6 w-full max-w-lg mx-auto">
            {children}
            {/* <div className="flex justify-center">{footer}</div> */}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthShell
