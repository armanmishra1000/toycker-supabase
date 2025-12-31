"use client"

import { useState, useRef, FormEvent } from "react"
import { useRouter } from "next/navigation"

interface ProductFormWrapperProps {
  productId: string
  action: (formData: FormData) => Promise<void>
  children: (args: {
    isSubmitting: boolean,
    handleSubmit: (e: FormEvent<HTMLFormElement>) => void
  }) => React.ReactNode
}

export function ProductFormWrapper({ productId, action, children }: ProductFormWrapperProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

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
