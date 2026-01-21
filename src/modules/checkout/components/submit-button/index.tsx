"use client"

import { Button } from "@modules/common/components/button"
import React from "react"
import { useFormStatus } from "react-dom"

export function SubmitButton({
  children,
  variant = "primary",
  size = "large",
  className,
  isLoading: isLoadingProp,
  disabled,
  "data-testid": dataTestId,
}: {
  children: React.ReactNode
  variant?: "primary" | "secondary" | "transparent" | "danger" | null
  size?: "small" | "base" | "large"
  className?: string
  isLoading?: boolean
  disabled?: boolean
  "data-testid"?: string
}) {
  const { pending } = useFormStatus()
  const isLoading = isLoadingProp || pending

  return (
    <Button
      size={size}
      className={className}
      type="submit"
      isLoading={isLoading}
      disabled={disabled}
      variant={variant || "primary"}
      data-testid={dataTestId}
    >
      {children}
    </Button>
  )
}