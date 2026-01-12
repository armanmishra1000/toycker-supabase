"use client"

import { useState, FormEvent } from "react"


interface ProductFormWrapperProps {
  productId: string
  action: (_formData: FormData) => Promise<void>
  children: (_args: {
    isSubmitting: boolean,
    handleSubmit: (_e: FormEvent<HTMLFormElement>) => void
  }) => React.ReactNode
}

export function ProductFormWrapper({ productId: _productId, action, children }: ProductFormWrapperProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)
      await action(formData)
    } catch (error) {
      console.error("Error saving product:", error)
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {children({ isSubmitting, handleSubmit })}
    </>
  )
}
