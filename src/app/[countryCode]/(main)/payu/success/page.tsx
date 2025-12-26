"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

// Simple inline SVG spinner component
const pathData = "M4 12a8 8 0 0 18-16 0 8 8 0 0 18-16 0"

function InlineSpinner() {
  return (
    <div className="flex items-center justify-center w-12 h-12">
      <svg
        className="animate-spin w-8 h-8 text-blue-600"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d={pathData}
        />
      </svg>
    </div>
  )
}

export default function PayUSuccessPage({ params }: { params: { countryCode: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { countryCode } = params
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const processPayment = async () => {
      try {
        const payuStatus = searchParams.get("status")
        const orderId = searchParams.get("orderId")
        const cartId = searchParams.get("cartId")
        const errorMessage = searchParams.get("error")

        console.log("[PayU Success] Status from URL:", { payuStatus, orderId, cartId, errorMessage, countryCode })

        if (payuStatus === "success") {
          setStatus("success")
          
          if (orderId) {
            // Standard order confirmation
            setTimeout(() => {
              router.push(`/${countryCode}/order/${orderId}/confirmed`)
            }, 1000)
          } else if (cartId) {
             // Edge case where order wasn't returned but payment was success
             // We can either try to retrieve the order here or show a general success message
             // and redirect to account/orders.
             setTimeout(() => {
                router.push(`/${countryCode}/account/orders`)
             }, 2000)
          } else {
             throw new Error("Payment success but no order ID or cart ID received")
          }
        } else {
          throw new Error(errorMessage || "Payment processing failed")
        }
      } catch (err) {
        console.error("[PayU Success] Error:", err)
        setStatus("error")
        setError(err instanceof Error ? err.message : "An error occurred")
        
        setTimeout(() => {
          router.push(`/${countryCode}/checkout?error=payment_failed`)
        }, 3000)
      }
    }

    processPayment()
  }, [router, searchParams, countryCode])

  if (status === "processing") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6">
        <InlineSpinner />
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Processing your payment...</h1>
          <p className="text-muted-foreground mt-2">
            Please wait while we confirm your order.
          </p>
        </div>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-destructive">
            Payment Processing Failed
          </h1>
          <p className="text-muted-foreground mt-2">{error}</p>
          <p className="text-sm text-muted-foreground mt-4">
            Redirecting to checkout...
          </p>
        </div>
      </div>
    )
  }

  return null
}
